import { Pagination, ButtonGroup, IconButton } from "@chakra-ui/react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import paginatedDataSlicer from "@/util/paginationDataSlicer.js";
import { useEffect, useState } from "react";

export default function DataPagination({data, setPaginationData}) {

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

  useEffect(()=>{
    const paginatedData = paginatedDataSlicer(data, currentPage, pageSize)
    setPaginationData(paginatedData)
  },[data,currentPage,pageSize,setPaginationData])

  return (
    <Pagination.Root
      count={data.length}
      pageSize={pageSize}
      page={currentPage}
      onPageChange={(details) => setCurrentPage(details.page)}
    >
      <ButtonGroup variant="ghost" size="sm" wrap="wrap" mt={3}>
        <Pagination.PrevTrigger asChild color="gray.100">
          <IconButton>
            <LuChevronLeft />
          </IconButton>
        </Pagination.PrevTrigger>

        <Pagination.Items
          render={(page) => (
            <IconButton
              variant={{ base: "ghost", _selected: "outline" }}
              color="gray.100"
            >
              {page.value}
            </IconButton>
          )}
        />

        <Pagination.NextTrigger asChild color="gray.100">
          <IconButton>
            <LuChevronRight />
          </IconButton>
        </Pagination.NextTrigger>
      </ButtonGroup>
    </Pagination.Root>
  );
}
