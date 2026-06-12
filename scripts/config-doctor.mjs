#!/usr/bin/env node
import { checkAppConfigFromFile, logConfigDoctorReport } from '../dist/common/config/bootstrap/index.js';
import { resolveAppConfigPath } from '../dist/common/config/bootstrap/index.js';

const filePath = process.argv[2] ?? resolveAppConfigPath();
const { report } = checkAppConfigFromFile(filePath);
logConfigDoctorReport(report, { force: true });
process.exit(report.ok ? 0 : 1);
