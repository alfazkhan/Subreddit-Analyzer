import type { PaginationDataSlicer } from "@/util/Types";

const paginationDataSlicer: PaginationDataSlicer = (data, currentPage, pageSize) => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return data?.slice(start, end);
};

export default paginationDataSlicer;