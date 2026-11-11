// Generates a reproducible, entirely synthetic dataset of phishing-drill deliveries.
import { mkdirSync } from 'node:fs';
import { DuckDBInstance } from '@duckdb/node-api';

mkdirSync('static/data', { recursive: true });

const instance = await DuckDBInstance.create(':memory:');
const connection = await instance.connect();

await connection.run(`SET threads = 1`);
await connection.run(`SELECT setseed(0.42)`);
await connection.run(`
COPY (
  WITH deliveries AS (
    SELECT
      c.campaign_id::INTEGER AS campaign_id,
      e.employee_id::INTEGER AS employee_id,
      random() AS click_roll,
      random() AS report_roll,
      random() AS time_roll,
      random() AS training_roll
    FROM range(1, 49) AS c(campaign_id)
    CROSS JOIN range(1, 25001) AS e(employee_id)
  ),
  shaped AS (
    SELECT
      *,
      ['Engineering', 'Finance', 'Sales', 'Marketing', 'Operations', 'Legal', 'Support', 'People'][(employee_id % 8) + 1] AS department,
      [0.72, 1.28, 1.18, 1.05, 0.96, 0.84, 1.36, 0.92][(employee_id % 8) + 1] AS department_risk,
      ['Credential reset', 'Invoice', 'Parcel delivery', 'HR policy', 'Shared document'][(campaign_id % 5) + 1] AS template,
      (campaign_id % 3) + 1 AS difficulty,
      campaign_id / 48.0 AS progress
    FROM deliveries
  ),
  outcomes AS (
    SELECT
      *,
      click_roll < [0.08, 0.16, 0.28][difficulty] * department_risk * (1 - 0.6 * progress) AS clicked
    FROM shaped
  ),
  reports AS (
    SELECT
      *,
      report_roll < CASE WHEN clicked THEN 0.10 ELSE 0.12 + 0.35 * progress END AS reported
    FROM outcomes
  )
  SELECT
    campaign_id,
    (DATE '2023-01-02' + ((campaign_id - 1) * 14)::INTEGER)::DATE AS sent_on,
    employee_id,
    department,
    template,
    difficulty::TINYINT AS difficulty,
    clicked,
    reported,
    (clicked AND training_roll < 0.85) AS trained,
    CASE WHEN reported THEN (60 - ln(greatest(time_roll, 0.000001)) * 3600)::INTEGER END AS seconds_to_report
  FROM reports
  ORDER BY campaign_id, employee_id
) TO 'static/data/events.parquet' (FORMAT PARQUET, COMPRESSION ZSTD, ROW_GROUP_SIZE 100000)
`);

const result = await connection.runAndReadAll(
	`SELECT count(*)::INTEGER FROM read_parquet('static/data/events.parquet')`
);
console.log(`Wrote ${result.getRows()[0][0]} synthetic rows to static/data/events.parquet`);
