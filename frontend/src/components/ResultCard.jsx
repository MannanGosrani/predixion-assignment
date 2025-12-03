import React from 'react'

function FieldRow({ label, children }) {
  return (
    <div className="field-row">
      <div className="f-label">{label}</div>
      <div className="f-value">{children}</div>
    </div>
  )
}

export default function ResultCard({ record }) {
  if (!record) return null

  const insights = record.insights || record // support both shapes
  return (
    <div className="card">
      <div className="card-head">
        <h3>Insights</h3>
        <div className={`sentiment ${insights.sentiment?.toLowerCase() || ''}`}>
          {insights.sentiment}
        </div>
      </div>

      <FieldRow label="Customer Intent">{insights.customer_intent}</FieldRow>
      <FieldRow label="Action Required">
        {insights.action_required ? 'Yes' : 'No'}
      </FieldRow>
      <FieldRow label="Summary">{insights.summary}</FieldRow>
    </div>
  )
}
