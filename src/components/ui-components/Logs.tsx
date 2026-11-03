import { Code } from "@chakra-ui/react"
import type { LogsProps } from "@/util/Types"


export default function Logs({}: LogsProps) {
  return <Code>{`console.log("Hello, world!")`}</Code>
}