import { getTemplates } from '@/macros/templates' with { type: 'macro' }

const newTemplates = getTemplates()

function buildTemplate(templateString: string) {
  // oxlint-disable-next-line no-new-func
  return new Function('locals', 'escapeFn', 'include', 'rethrow', templateString)
}

export const template = {
  index: buildTemplate(newTemplates.index),
  verify: buildTemplate(newTemplates.verify),
  whatIs: buildTemplate(newTemplates.whatIs),
  privacy: buildTemplate(newTemplates.privacy),
}
