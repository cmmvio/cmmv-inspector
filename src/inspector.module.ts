import { Module } from '@cmmv/core';

import { Inspector } from './inspector.service';

export const RepositoryModule = new Module('inspector', {
    providers: [Inspector],
});
