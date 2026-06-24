"use client";

import { useState, useMemo } from "react";

export interface Column<T> {
    key: keyof T | string;
    label: string;
    sortable?: boolean;
    render?: (row: T) => React.ReactNode;
    /** For sorting when using render — provide a value extractor */
    sortValue?: (row: T) => string | number;
}

interface DataTableProps<T extends object> {
    columns: Column<T>[];
    data: T[];
    pageSize?: number;
    searchKeys?: (keyof T)[];
    searchPlaceholder?: string;
    /** Slot for extra toolbar controls (e.g. date filter dropdowns) */
    toolbarExtra?: React.ReactNode;
    emptyMessage?: string;
    rowKey: (row: T) => string | number;
}

type SortDir = "asc" | "desc" | null;

export default function DataTable<T extends object>({
    columns,
    data,
    pageSize = 25,
    searchKeys = [],
    searchPlaceholder = "Search…",
    toolbarExtra,
    emptyMessage = "No data found",
    rowKey,
}: DataTableProps<T>) {
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<SortDir>(null);

    // Filter
    const filtered = useMemo(() => {
        if (!query.trim() || searchKeys.length === 0) return data;
        const q = query.toLowerCase();
        return data.filter((row) =>
            searchKeys.some((k) => {
                const v = (row as any)[k];
                return v != null && String(v).toLowerCase().includes(q);
            }),
        );
    }, [data, query, searchKeys]);

    // Sort
    const sorted = useMemo(() => {
        if (!sortKey || !sortDir) return filtered;
        const col = columns.find((c) => c.key === sortKey);
        return [...filtered].sort((a, b) => {
            const va = col?.sortValue ? col.sortValue(a) : (a as any)[sortKey] ?? "";
            const vb = col?.sortValue ? col.sortValue(b) : (b as any)[sortKey] ?? "";
            if (typeof va === "number" && typeof vb === "number") {
                return sortDir === "asc" ? va - vb : vb - va;
            }
            return sortDir === "asc"
                ? String(va).localeCompare(String(vb))
                : String(vb).localeCompare(String(va));
        });
    }, [filtered, sortKey, sortDir, columns]);

    // Paginate
    const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const pageData = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    function handleSort(key: string) {
        if (sortKey !== key) { setSortKey(key); setSortDir("asc"); }
        else if (sortDir === "asc") setSortDir("desc");
        else { setSortKey(null); setSortDir(null); }
        setPage(1);
    }

    function handleSearch(val: string) { setQuery(val); setPage(1); }

    // Build compact page number list
    function pageNumbers() {
        const pages: (number | "…")[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push("…");
            for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
            if (currentPage < totalPages - 2) pages.push("…");
            pages.push(totalPages);
        }
        return pages;
    }

    const startRow = sorted.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endRow = Math.min(currentPage * pageSize, sorted.length);

    return (
        <div className="datatable-wrap">
            {/* Toolbar */}
            <div className="datatable-toolbar">
                {searchKeys.length > 0 && (
                    <input
                        type="search"
                        className="datatable-search"
                        placeholder={searchPlaceholder}
                        value={query}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                )}
                {toolbarExtra}
                <span className="datatable-count">
                    {sorted.length === data.length
                        ? `${data.length} rows`
                        : `${sorted.length} of ${data.length} rows`}
                </span>
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto" }}>
                <table>
                    <thead>
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={String(col.key)}
                                    className={[
                                        col.sortable ? "sortable" : "",
                                        sortKey === col.key && sortDir === "asc" ? "sort-asc" : "",
                                        sortKey === col.key && sortDir === "desc" ? "sort-desc" : "",
                                    ].join(" ")}
                                    onClick={col.sortable ? () => handleSort(String(col.key)) : undefined}
                                >
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {pageData.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            pageData.map((row) => (
                                <tr key={rowKey(row)}>
                                    {columns.map((col) => (
                                        <td key={String(col.key)}>
                                            {col.render
                                                ? col.render(row)
                                                : String((row as any)[col.key] ?? "—")}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="datatable-pagination">
                    <span className="datatable-page-info">
                        {startRow}–{endRow} of {sorted.length}
                    </span>
                    <div className="datatable-page-btns">
                        <button className="datatable-page-btn" disabled={currentPage === 1} onClick={() => setPage(1)}>«</button>
                        <button className="datatable-page-btn" disabled={currentPage === 1} onClick={() => setPage((p) => p - 1)}>‹</button>
                        {pageNumbers().map((p, i) =>
                            p === "…" ? (
                                <span key={`ellipsis-${i}`} style={{ color: "var(--text-muted)", padding: "0 4px" }}>…</span>
                            ) : (
                                <button
                                    key={p}
                                    className={`datatable-page-btn${currentPage === p ? " active" : ""}`}
                                    onClick={() => setPage(p as number)}
                                >
                                    {p}
                                </button>
                            ),
                        )}
                        <button className="datatable-page-btn" disabled={currentPage === totalPages} onClick={() => setPage((p) => p + 1)}>›</button>
                        <button className="datatable-page-btn" disabled={currentPage === totalPages} onClick={() => setPage(totalPages)}>»</button>
                    </div>
                </div>
            )}
        </div>
    );
}
