

import CollaboratorVideo, { ICollaboratorVideo, ICollaboratorVideoMethods, CollaboratorVideoModel } from '~/core/entities/collaboratorVideo.entity.server';
import { BaseService } from '~/core/abstracts/service.server';
import mongoose from 'mongoose';

export default class CollaboratorVideoService extends BaseService<ICollaboratorVideo, ICollaboratorVideoMethods, CollaboratorVideoModel> {
  constructor() {
    super(CollaboratorVideo);
  }

  private static instance: CollaboratorVideoService;

  public static getInstance(): CollaboratorVideoService {
    if (!CollaboratorVideoService.instance) {
      CollaboratorVideoService.instance = new CollaboratorVideoService();
    }
    return CollaboratorVideoService.instance;
  }
}

export const collaboratorVideoService = CollaboratorVideoService.getInstance();