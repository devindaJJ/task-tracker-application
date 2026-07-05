import "./Pagination.css";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, onPageChange }: PaginationProps) {
  if (total === 0) return null;

  return (
    <div className="pagination">
      <span className="pagination-summary">
        Page {page} of {totalPages} · {total} task{total === 1 ? "" : "s"}
      </span>
      <div className="pagination-controls">
        <button
          className="btn btn-secondary"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Previous
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}
