import { Module } from '@cmmv/core';

import { Inspector } from "../services/inspector.service";

export const RepositoryModule = new Module('inspector', {
    providers: [Inspector]
});
