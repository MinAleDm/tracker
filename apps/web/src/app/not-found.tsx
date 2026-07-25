import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main-content" className="grid min-h-screen place-items-center bg-surface px-5 py-12">
      <section className="tracker-panel w-full max-w-lg rounded-xl p-8 text-center">
        <p className="font-mono text-xs font-semibold uppercase text-accent">404</p>
        <h1 className="mt-3 text-2xl font-semibold text-text">Страница не найдена</h1>
        <p className="mt-2 text-sm leading-6 text-text/54">Возможно, адрес изменился или у вас больше нет доступа к этому разделу.</p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-10 items-center justify-center rounded-lg bg-[#25282e] px-4 text-sm font-semibold text-white transition hover:bg-[#17191d]"
        >
          Вернуться на главную
        </Link>
      </section>
    </main>
  );
}
