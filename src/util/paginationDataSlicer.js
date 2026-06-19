export default function paginationDataSlicer(data, currentPage, pageSize){
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return data?.slice(start, end);
}