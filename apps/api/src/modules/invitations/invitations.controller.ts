import {
	Body,
	Controller,
	Param,
	Post,
} from "@nestjs/common";
import { Public } from "../../common/auth/public.decorator";
import { RateLimit } from "../../common/rate-limit/rate-limit.decorator";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import type { RequestUser } from "../../common/auth/request-user";
import { AcceptInvitationBodyDto } from "./dto/accept-invitation.dto";
import { CreateInvitationBodyDto } from "./dto/create-invitation.dto";
import { InvitationsService } from "./invitations.service";

@Controller()
export class InvitationsController {
	constructor(
		private readonly invitationsService: InvitationsService,
	) {}

	@Post("organizations/:organizationId/invitations")
	createInvitation(
		@CurrentUser() user: RequestUser,
		@Param("organizationId") organizationId: string,
		@Body() dto: CreateInvitationBodyDto,
	) {
		return this.invitationsService.createInvitation(
			organizationId,
			user.userId,
			dto,
		);
	}

	@Public()
	@RateLimit({ limit: 10, windowMs: 60_000 })
	@Post("auth/invitations/accept")
	acceptInvitation(@Body() dto: AcceptInvitationBodyDto) {
		return this.invitationsService.acceptInvitation(dto);
	}
}
