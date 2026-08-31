type EvidenceRow = { kind: string; position: number; content: unknown };

function contentOf(row: EvidenceRow | undefined) {
  return (row?.content && typeof row.content === "object" ? row.content : {}) as Record<string, string>;
}

export function ExplorationReport({ evidence }: { evidence: EvidenceRow[] }) {
  const desires = evidence.filter((item) => item.kind === "DAY_1_DESIRE_SIGNAL").sort((a, b) => a.position - b.position).map(contentOf);
  const scan = contentOf(evidence.find((item) => item.kind === "DAY_2_REALITY_SCAN"));
  const contact = contentOf(evidence.find((item) => item.kind === "DAY_3_HUMAN_CONTACT"));
  const experimentA = contentOf(evidence.find((item) => item.kind === "DAY_4_EXPERIMENT_A"));
  const feedback = contentOf(evidence.find((item) => item.kind === "DAY_5_REAL_FEEDBACK"));
  const experimentB = contentOf(evidence.find((item) => item.kind === "DAY_6_EXPERIMENT_B"));
  const decision = contentOf(evidence.find((item) => item.kind === "DAY_7_DECISION"));

  return (
    <div className="report-sections">
      <section className="report-section">
        <h2>这轮探索从哪里开始</h2>
        <ul className="evidence-list">{desires.map((desire, index) => <li key={index}><strong>{desire.admiredPerson}</strong><span>{desire.admiredQuality}；愿意承担：{desire.acceptedCost}</span></li>)}</ul>
      </section>
      <section className="report-section">
        <h2>现实纠正了什么</h2>
        <dl className="report-facts">
          <div><dt>调查方向</dt><dd>{scan.candidateDirection}</dd></div>
          <div><dt>真实工作</dt><dd>{scan.actualWork}</dd></div>
          <div><dt>真人碰撞</dt><dd>{contact.surprise}</dd></div>
          <div><dt>真实反馈</dt><dd>{feedback.unexpectedFeedback}</dd></div>
        </dl>
      </section>
      <section className="report-section experiment-comparison">
        <h2>两次行动的比较</h2>
        <div><strong>实验 A · {experimentA.direction}</strong><p>{experimentA.whatHappened}</p><span>专注 {experimentA.focusScore}/5 · 继续意愿 {experimentA.continueScore}/5</span></div>
        <div><strong>实验 B · {experimentB.direction}</strong><p>{experimentB.whatHappened}</p><span>专注 {experimentB.focusScore}/5 · 继续意愿 {experimentB.continueScore}/5</span></div>
        <p className="comparison-conclusion">{experimentB.comparison}</p>
      </section>
      <section className="decision-panel">
        <h2>当前方向判断</h2>
        <dl className="report-facts">
          <div><dt>继续验证</dt><dd><strong>{decision.continueDirection}</strong><br />{decision.continueEvidence}</dd></div>
          <div><dt>暂时排除</dt><dd><strong>{decision.rejectedDirection}</strong><br />{decision.rejectedEvidence}</dd></div>
          {decision.insufficientDirection ? <div><dt>证据不足</dt><dd>{decision.insufficientDirection}</dd></div> : null}
        </dl>
      </section>
      <section className="next-experiment">
        <p>未来 14 天唯一值得做的事</p>
        <h2>{decision.nextExperiment}</h2>
        <span>完成标准：{decision.successCriterion}</span>
      </section>
    </div>
  );
}
