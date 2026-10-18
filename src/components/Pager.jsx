export default function Pager({ page, pageSize, total, onPage, busy }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;
  const from = page * pageSize + 1;
  const to = Math.min(total, (page + 1) * pageSize);

  return (
    <nav className="pager" aria-label="Pagination">
      <span className="pager-info">Showing {from}–{to} of {total}</span>
      <div className="pager-btns">
        <button className="btn" disabled={busy || page === 0} onClick={() => onPage(0)} aria-label="First page">«</button>
        <button className="btn" disabled={busy || page === 0} onClick={() => onPage(page - 1)}>Previous</button>
        <span className="pager-page">Page {page + 1} of {pages}</span>
        <button className="btn" disabled={busy || page >= pages - 1} onClick={() => onPage(page + 1)}>Next</button>
        <button className="btn" disabled={busy || page >= pages - 1} onClick={() => onPage(pages - 1)} aria-label="Last page">»</button>
      </div>
    </nav>
  );
}
