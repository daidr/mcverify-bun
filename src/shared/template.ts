import { compile } from 'handlebars'
import IndexTemplate from '@/views/index.hbs' with { type: 'text' }
import PrivacyTemplate from '@/views/privacy.hbs' with { type: 'text' }
import VerifyTemplate from '@/views/verify.hbs' with { type: 'text' }
import WhatIsTemplate from '@/views/whatis.hbs' with { type: 'text' }

const options: Parameters<typeof compile>[1] = {
  knownHelpers: {},
  knownHelpersOnly: true,
}

export const template = {
  index: compile(IndexTemplate, options),
  verify: compile(VerifyTemplate, options),
  whatIs: compile(WhatIsTemplate, options),
  privacy: compile(PrivacyTemplate, options),
}
