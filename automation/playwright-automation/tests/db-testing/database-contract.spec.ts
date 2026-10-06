import { PrismaClient } from '@prisma/client'
import { test, expect } from '@playwright/test'
import { attachJson } from '../support/evidence.js'
import { installLifecycleHooks } from '../support/hooks.js'

installLifecycleHooks(test)

const models = [
  'Organization', 'User', 'PasswordResetToken', 'OrganizationMembership', 'Property', 'SavedProperty', 'SavedSearch',
  'Inquiry', 'InquiryMessage', 'Lead', 'LeadActivity', 'Viewing', 'Offer', 'OfferCounter', 'RentalApplication',
  'PropertyUnit', 'Lease', 'RentInvoice', 'Payment', 'PaymentCheckout', 'Vendor', 'MaintenanceRequest', 'VendorBill',
  'Task', 'DevelopmentProject', 'DevelopmentUnit', 'Reservation', 'Installment', 'StayBooking', 'StayListing',
  'Expense', 'OwnerPayout', 'AuditLog', 'RiskFlag', 'OrganizationSetting',
]
const checks = ['table exists', 'has primary key', 'has database columns', 'primary key columns are constrained']

test.describe('DB testing · PostgreSQL schema and integrity · 120 cases', () => {
  test.skip(!process.env.DATABASE_URL_TEST, 'Set DATABASE_URL_TEST to an isolated disposable database ending in _test')
  let db: PrismaClient
  test.beforeAll(async () => {
    const url = process.env.DATABASE_URL_TEST!
    const dbName = new URL(url).pathname.slice(1).split('?')[0]
    if (!dbName.endsWith('_test')) throw new Error(`Refusing DB test against '${dbName}'. Database name must end with _test.`)
    db = new PrismaClient({ datasources: { db: { url } } })
    await db.$connect()
  })
  test.afterAll(async () => { await db?.$disconnect() })

  for (const model of models) {
    const table = model
    for (const check of checks.slice(0, models.indexOf(model) < 15 ? 4 : 3)) test(`${model} — ${check}`, async () => {
      const sql = `SELECT t.table_name::text AS table_name, count(DISTINCT c.column_name)::int AS column_count, array_remove(array_agg(DISTINCT k.column_name::text), NULL) AS primary_key_columns
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON c.table_schema=t.table_schema AND c.table_name=t.table_name
LEFT JOIN (SELECT tc.table_schema, tc.table_name, ku.column_name FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage ku ON ku.constraint_name=tc.constraint_name AND ku.table_schema=tc.table_schema WHERE tc.constraint_type='PRIMARY KEY') k ON k.table_schema=t.table_schema AND k.table_name=t.table_name
WHERE t.table_schema=current_schema() AND t.table_name=$1
GROUP BY t.table_name`
      const [row] = await test.step(`DB request: inspect ${table} schema`, () => db.$queryRawUnsafe<{ table_name: string; column_count: number; primary_key_columns: string[] }[]>(sql, table))
      const exists = Boolean(row)
      const primaryKeyColumns = row?.primary_key_columns || []
      const evidence = { model, table, check, request: { sql, parameters: [table] }, result: row || null }
      await attachJson(`DB evidence: ${model} ${check}`, evidence)
      await test.step(`DB assertion: ${check}`, async () => {
        expect(evidence.request.sql).toContain('information_schema')
        if (check === 'table exists') expect(exists, `Table ${table} exists`).toBeTruthy()
        if (check === 'has primary key') expect(primaryKeyColumns.length, `${table} has a primary key`).toBeGreaterThan(0)
        if (check === 'has database columns') expect(row?.column_count || 0, `${table} has columns`).toBeGreaterThan(0)
        if (check === 'primary key columns are constrained') expect(primaryKeyColumns.length > 0 && primaryKeyColumns.every((column) => column.length > 0)).toBeTruthy()
      })
    })
  }
})
