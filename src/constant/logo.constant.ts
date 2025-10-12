import { CONFIG } from '../config'
import TEXT_LOGO from './logo.txt' with { type: 'text' }

export const STARTUP_TEXT = `\
━━━━━━━━━━━━━━━━━━━━━━━━━━
${TEXT_LOGO}\
Version: ${CONFIG.constant.version} (${CONFIG.constant.commit})
Bun Runtime: ${CONFIG.constant.bun}
Environment: ${CONFIG.constant.environment}
━━━━━━━━━━━━━━━━━━━━━━━━━━`
