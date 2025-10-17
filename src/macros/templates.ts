import ejs from 'ejs'
import IndexTemplate from '@/views/index.ejs' with { type: 'text' }
import PrivacyTemplate from '@/views/privacy.ejs' with { type: 'text' }
import VerifyTemplate from '@/views/verify.ejs' with { type: 'text' }
import WhatIsTemplate from '@/views/whatis.ejs' with { type: 'text' }

function compileTemplate(templateString: string) {
  return ejs.compile(templateString, {
    debug: false,
    compileDebug: false,
    rmWhitespace: true,
    client: true,
  }).toString().replace(/\n/g, '').replace('function anonymous(locals, escapeFn, include, rethrow) {', '').slice(0, -1)
}

export function getTemplates() {
  return {
    index: compileTemplate(IndexTemplate),
    privacy: compileTemplate(PrivacyTemplate),
    whatIs: compileTemplate(WhatIsTemplate),
    verify: compileTemplate(VerifyTemplate),
  }
}
