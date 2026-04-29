import { hash } from "bcryptjs";
import {
  PrismaClient,
  TaskPriority,
  TaskStatus,
  UserRole,
  type OrganizationRole,
} from "@prisma/client";

process.env.DATABASE_URL ??= "postgresql://tracker:tracker@localhost:5432/tracker?schema=public";

const prisma = new PrismaClient({
  log: ["warn", "error"],
});

type SeedUser = {
  email: string;
  name: string;
  role?: UserRole;
  membershipRole: OrganizationRole;
};

type SeedTask = {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeEmail?: string;
  creatorEmail: string;
  createdAt: string;
  updatedAt: string;
  comments: Array<{
    authorEmail: string;
    body: string;
  }>;
};

async function ensureUser(user: SeedUser, passwordHash: string) {
  return prisma.user.upsert({
    where: { email: user.email },
    update: {
      name: user.name,
      passwordHash,
      role: user.role ?? UserRole.USER,
    },
    create: {
      email: user.email,
      name: user.name,
      passwordHash,
      role: user.role ?? UserRole.USER,
    },
  });
}

async function ensureProjectTask(
  projectId: string,
  task: SeedTask,
  usersByEmail: Map<string, string>,
) {
  const existing = await prisma.task.findFirst({
    where: {
      projectId,
      title: task.title,
    },
    include: {
      comments: true,
      activities: true,
    },
  });

  const assigneeId = task.assigneeEmail ? usersByEmail.get(task.assigneeEmail) ?? null : null;
  const creatorId = usersByEmail.get(task.creatorEmail);

  if (!creatorId) {
    throw new Error(`Missing creator for seed task "${task.title}"`);
  }

  const taskRecord =
    existing ??
    (await prisma.task.create({
      data: {
        projectId,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        creatorId,
        assigneeId,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
      },
      include: {
        comments: true,
        activities: true,
      },
    }));

  if (!existing) {
    await prisma.taskActivity.create({
      data: {
        taskId: taskRecord.id,
        actorId: creatorId,
        action: "task.created",
        afterValue: task.title,
        createdAt: new Date(task.createdAt),
      },
    });
  }

  if (taskRecord.comments.length === 0 && task.comments.length > 0) {
    for (const [index, comment] of task.comments.entries()) {
      const authorId = usersByEmail.get(comment.authorEmail);

      if (!authorId) {
        continue;
      }

      const createdAt = new Date(new Date(task.updatedAt).getTime() - (task.comments.length - index) * 60 * 60 * 1000);

      await prisma.taskComment.create({
        data: {
          taskId: taskRecord.id,
          authorId,
          body: comment.body,
          createdAt,
          updatedAt: createdAt,
        },
      });

      await prisma.taskActivity.create({
        data: {
          taskId: taskRecord.id,
          actorId: authorId,
          action: "task.commented",
          afterValue: comment.body,
          createdAt,
        },
      });
    }
  }

  if (taskRecord.activities.length <= 1) {
    await prisma.taskActivity.createMany({
      data: [
        {
          taskId: taskRecord.id,
          actorId: creatorId,
          action: "task.updated",
          field: "status",
          beforeValue: "TODO",
          afterValue: task.status,
          createdAt: new Date(task.updatedAt),
        },
        {
          taskId: taskRecord.id,
          actorId: assigneeId ?? creatorId,
          action: "task.updated",
          field: "priority",
          beforeValue: "MEDIUM",
          afterValue: task.priority,
          createdAt: new Date(new Date(task.updatedAt).getTime() + 15 * 60 * 1000),
        },
      ],
      skipDuplicates: false,
    });
  }
}

async function main() {
  const email = process.env.DEMO_USER_EMAIL ?? "owner@tracker.local";
  const password = process.env.DEMO_USER_PASSWORD ?? "changeme123";
  const passwordHash = await hash(password, 10);

  const users: SeedUser[] = [
    { email, name: "Tracker Owner", role: UserRole.ADMIN, membershipRole: "OWNER" },
    { email: "engineer@tracker.local", name: "Nina Engineer", membershipRole: "ADMIN" },
    { email: "reviewer@tracker.local", name: "Alex Reviewer", membershipRole: "MEMBER" },
    { email: "analyst@tracker.local", name: "Marta Analyst", membershipRole: "MEMBER" },
    { email: "designer@tracker.local", name: "Ilya Designer", membershipRole: "MEMBER" },
  ];

  const createdUsers = await Promise.all(users.map((user) => ensureUser(user, passwordHash)));
  const usersByEmail = new Map(createdUsers.map((user) => [user.email, user.id]));

  const organization = await prisma.organization.upsert({
    where: { slug: "acme-platform" },
    update: {
      name: "Acme Platform",
    },
    create: {
      name: "Acme Platform",
      slug: "acme-platform",
    },
  });

  await Promise.all(
    users.map((user) =>
      prisma.organizationMembership.upsert({
        where: {
          organizationId_userId: {
            organizationId: organization.id,
            userId: usersByEmail.get(user.email)!,
          },
        },
        update: {
          role: user.membershipRole,
        },
        create: {
          organizationId: organization.id,
          userId: usersByEmail.get(user.email)!,
          role: user.membershipRole,
        },
      }),
    ),
  );

  const projects = await Promise.all([
    prisma.project.upsert({
      where: {
        organizationId_key: {
          organizationId: organization.id,
          key: "CORE",
        },
      },
      update: {
        name: "Core Platform",
        description: "Релизы, платформа и core delivery команды.",
      },
      create: {
        organizationId: organization.id,
        key: "CORE",
        name: "Core Platform",
        description: "Релизы, платформа и core delivery команды.",
      },
    }),
    prisma.project.upsert({
      where: {
        organizationId_key: {
          organizationId: organization.id,
          key: "PARSER",
        },
      },
      update: {
        name: "Parser Kanban",
        description: "Рабочая доска команды парсинга с ревью, daily и backlog-потоком.",
      },
      create: {
        organizationId: organization.id,
        key: "PARSER",
        name: "Parser Kanban",
        description: "Рабочая доска команды парсинга с ревью, daily и backlog-потоком.",
      },
    }),
    prisma.project.upsert({
      where: {
        organizationId_key: {
          organizationId: organization.id,
          key: "DAILY",
        },
      },
      update: {
        name: "Parser Daily",
        description: "Ежедневные отчёты, ссылки и статус выполнения по поставкам.",
      },
      create: {
        organizationId: organization.id,
        key: "DAILY",
        name: "Parser Daily",
        description: "Ежедневные отчёты, ссылки и статус выполнения по поставкам.",
      },
    }),
    prisma.project.upsert({
      where: {
        organizationId_key: {
          organizationId: organization.id,
          key: "BACKLOG",
        },
      },
      update: {
        name: "Parser Backlog",
        description: "Большая очередь входящих задач с приоритизацией и распределением.",
      },
      create: {
        organizationId: organization.id,
        key: "BACKLOG",
        name: "Parser Backlog",
        description: "Большая очередь входящих задач с приоритизацией и распределением.",
      },
    }),
  ]);

  const [coreProject, parserProject, dailyProject, backlogProject] = projects;

  const coreTasks: SeedTask[] = [
    {
      title: "Ship realtime activity stream",
      description: "Persist task updates, broadcast them to clients, and surface fresh activity in the dashboard.",
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      assigneeEmail: "engineer@tracker.local",
      creatorEmail: email,
      createdAt: "2026-04-02T10:30:00.000Z",
      updatedAt: "2026-04-11T12:10:00.000Z",
      comments: [
        { authorEmail: email, body: "Первый релиз делаем с live invalidation и activity feed." },
        { authorEmail: "engineer@tracker.local", body: "Сокеты уже подняты, осталось аккуратно обновить фронт." },
      ],
    },
    {
      title: "Audit refresh-token rotation",
      description: "Проверить безопасность refresh flow и подготовить production-ready конфиг для секретов.",
      status: TaskStatus.REVIEW,
      priority: TaskPriority.MEDIUM,
      assigneeEmail: "reviewer@tracker.local",
      creatorEmail: email,
      createdAt: "2026-04-06T08:15:00.000Z",
      updatedAt: "2026-04-14T14:20:00.000Z",
      comments: [{ authorEmail: "reviewer@tracker.local", body: "Осталось проверить revoke старых refresh-токенов под нагрузкой." }],
    },
    {
      title: "Prepare Docker release checklist",
      description: "Собрать production checklist: переменные окружения, миграции, healthcheck и rollback-план.",
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      assigneeEmail: "analyst@tracker.local",
      creatorEmail: email,
      createdAt: "2026-04-10T09:00:00.000Z",
      updatedAt: "2026-04-15T11:00:00.000Z",
      comments: [{ authorEmail: "analyst@tracker.local", body: "Вынесла отдельный список для preflight-проверок перед релизом." }],
    },
  ];

  const parserTasks: SeedTask[] = [
    {
      title: "RUN Unit // Создать демо-проект с демонстрацией фич из ресерча",
      description: "Подготовить демонстрационный сервис и показать команде практическую ценность observability и structured errors.",
      status: TaskStatus.REVIEW,
      priority: TaskPriority.MEDIUM,
      assigneeEmail: "engineer@tracker.local",
      creatorEmail: "reviewer@tracker.local",
      createdAt: "2026-03-23T10:21:00.000Z",
      updatedAt: "2026-04-15T09:35:00.000Z",
      comments: [
        { authorEmail: "reviewer@tracker.local", body: "Добавила в описание два дополнительных пункта, возьми их тоже в рамках задачи." },
        { authorEmail: "engineer@tracker.local", body: "Сделал прототип, осталось упаковать материалы и пройтись по UX." },
      ],
    },
    {
      title: "ARC Unit // Автоматизировать выгрузку ежедневного отчёта",
      description: "Автоматизировать daily-выгрузку в Google Sheets и добавить уведомления при неуспешной синхронизации.",
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      assigneeEmail: "analyst@tracker.local",
      creatorEmail: "engineer@tracker.local",
      createdAt: "2026-04-03T09:15:00.000Z",
      updatedAt: "2026-04-16T07:50:00.000Z",
      comments: [{ authorEmail: "analyst@tracker.local", body: "Часть таблиц уже едет автоматически, осталось закрыть fallback на ошибки API." }],
    },
    {
      title: "Parser // Ежедневный мониторинг сбора данных",
      description: "Собрать единый дашборд по свежести парсинга и проблемным интеграциям.",
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      assigneeEmail: "designer@tracker.local",
      creatorEmail: "analyst@tracker.local",
      createdAt: "2026-04-08T08:00:00.000Z",
      updatedAt: "2026-04-14T16:30:00.000Z",
      comments: [{ authorEmail: "designer@tracker.local", body: "Нужно ещё согласовать визуал сводного дашборда и логики цветовых акцентов." }],
    },
    {
      title: "M.A.V.A. // Отрисовка UI для трекера",
      description: "Собрать production-ready shell: sidebar, board, queue и detail view по референсам.",
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.URGENT,
      assigneeEmail: "designer@tracker.local",
      creatorEmail: email,
      createdAt: "2026-04-11T09:40:00.000Z",
      updatedAt: "2026-04-16T10:10:00.000Z",
      comments: [
        { authorEmail: "designer@tracker.local", body: "Вывела сетку, остались polish и адаптивы." },
        { authorEmail: email, body: "Важно, чтобы доска, backlog и карточка задачи выглядели как один продукт." },
      ],
    },
    {
      title: "Parser // Интеграция с уведомлениями по ревью",
      description: "Сделать выделение review-задач и добавить быстрый срез по задачам, ожидающим подтверждения.",
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      assigneeEmail: "reviewer@tracker.local",
      creatorEmail: email,
      createdAt: "2026-04-05T07:20:00.000Z",
      updatedAt: "2026-04-13T15:40:00.000Z",
      comments: [{ authorEmail: "reviewer@tracker.local", body: "Ревью-фильтр готов, можно использовать как отдельный режим в списке." }],
    },
  ];

  const dailyTasks: SeedTask[] = [
    {
      title: "ARC Daily - 02.04.2026",
      description: "ADS report, CAT Parsing report и основные приоритеты по проблемным маркетам.",
      status: TaskStatus.DONE,
      priority: TaskPriority.MEDIUM,
      assigneeEmail: "analyst@tracker.local",
      creatorEmail: "analyst@tracker.local",
      createdAt: "2026-04-02T08:55:00.000Z",
      updatedAt: "2026-04-07T08:51:00.000Z",
      comments: [{ authorEmail: "analyst@tracker.local", body: "Отчёт закрыт, все ссылки и follow-up задачи прикреплены." }],
    },
    {
      title: "ARC Daily - 03.04.2026",
      description: "Срез по API-ошибкам, объёму данных и рискам на утро пятницы.",
      status: TaskStatus.DONE,
      priority: TaskPriority.LOW,
      assigneeEmail: "analyst@tracker.local",
      creatorEmail: "analyst@tracker.local",
      createdAt: "2026-04-03T08:20:00.000Z",
      updatedAt: "2026-04-08T08:35:00.000Z",
      comments: [{ authorEmail: "engineer@tracker.local", body: "Вынесли проблемы с API в отдельный follow-up backlog item." }],
    },
    {
      title: "ARC Daily - 06.04.2026",
      description: "Ежедневный отчёт по сбору, нагрузке и новым инцидентам после выходных.",
      status: TaskStatus.DONE,
      priority: TaskPriority.MEDIUM,
      assigneeEmail: "reviewer@tracker.local",
      creatorEmail: "reviewer@tracker.local",
      createdAt: "2026-04-06T08:15:00.000Z",
      updatedAt: "2026-04-10T10:00:00.000Z",
      comments: [{ authorEmail: "reviewer@tracker.local", body: "Привязал отчёт к задаче по backlog-очистке." }],
    },
    {
      title: "ARC Daily - 07.04.2026",
      description: "Отчёт по SLA и распределению задач после чистки backlog.",
      status: TaskStatus.REVIEW,
      priority: TaskPriority.MEDIUM,
      assigneeEmail: "reviewer@tracker.local",
      creatorEmail: "reviewer@tracker.local",
      createdAt: "2026-04-07T08:45:00.000Z",
      updatedAt: "2026-04-16T08:35:00.000Z",
      comments: [{ authorEmail: email, body: "Проверь, что все ссылки и итоговые цифры совпадают с актуальным листом." }],
    },
  ];

  const backlogTasks: SeedTask[] = [
    {
      title: "ARC Unit // Refactoring DiXY_APP [105]",
      description: "Перенести старую интеграцию на новый pipeline и разложить работу по итерациям.",
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      assigneeEmail: "engineer@tracker.local",
      creatorEmail: "reviewer@tracker.local",
      createdAt: "2026-04-01T11:00:00.000Z",
      updatedAt: "2026-04-09T10:00:00.000Z",
      comments: [{ authorEmail: "engineer@tracker.local", body: "Нужен отдельный spike по миграции конфигов." }],
    },
    {
      title: "ARC Unit // Refactoring Apteka 36.6 [132]",
      description: "Разобрать узкие места в очереди и вынести настройку ретраев в конфиг.",
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      assigneeEmail: "analyst@tracker.local",
      creatorEmail: "reviewer@tracker.local",
      createdAt: "2026-04-04T09:10:00.000Z",
      updatedAt: "2026-04-12T12:45:00.000Z",
      comments: [{ authorEmail: "analyst@tracker.local", body: "Вынесла проблемные шаги в backlog и обновила ожидаемую оценку." }],
    },
    {
      title: "ARC Unit // Okeydostavka APP [97] // Refactoring",
      description: "Пересобрать интеграцию с новым шаблоном очереди и вычистить старые ручные шаги.",
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      assigneeEmail: "designer@tracker.local",
      creatorEmail: email,
      createdAt: "2026-04-07T13:15:00.000Z",
      updatedAt: "2026-04-15T17:15:00.000Z",
      comments: [{ authorEmail: "designer@tracker.local", body: "Есть риск по совместимости шаблонов, фиксирую отдельно." }],
    },
    {
      title: "ARC Unit // Holodilnik APP [210] // Refactoring",
      description: "Довести backlog item до конкретного технического плана и подготовить handoff в разработку.",
      status: TaskStatus.REVIEW,
      priority: TaskPriority.URGENT,
      assigneeEmail: "reviewer@tracker.local",
      creatorEmail: email,
      createdAt: "2026-04-09T10:10:00.000Z",
      updatedAt: "2026-04-16T09:20:00.000Z",
      comments: [{ authorEmail: "reviewer@tracker.local", body: "Жду подтверждение по оценке и можно переводить в работу." }],
    },
    {
      title: "ARC Unit // e-zoo [274] // Refactoring",
      description: "Подготовить backlog карточку для следующего спринта с разбивкой на подзадачи.",
      status: TaskStatus.TODO,
      priority: TaskPriority.LOW,
      assigneeEmail: "designer@tracker.local",
      creatorEmail: "analyst@tracker.local",
      createdAt: "2026-04-10T11:25:00.000Z",
      updatedAt: "2026-04-15T18:00:00.000Z",
      comments: [{ authorEmail: "analyst@tracker.local", body: "Собрала контекст и приложила базовые требования для декомпозиции." }],
    },
  ];

  for (const task of coreTasks) {
    await ensureProjectTask(coreProject.id, task, usersByEmail);
  }

  for (const task of parserTasks) {
    await ensureProjectTask(parserProject.id, task, usersByEmail);
  }

  for (const task of dailyTasks) {
    await ensureProjectTask(dailyProject.id, task, usersByEmail);
  }

  for (const task of backlogTasks) {
    await ensureProjectTask(backlogProject.id, task, usersByEmail);
  }

  console.info(`Seeded demo data. Login: ${email} / ${password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
