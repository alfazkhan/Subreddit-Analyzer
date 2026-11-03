import { useNavigate } from "react-router-dom"
import type { AboutProjectProps } from "@/util/Types";

export default function AboutProject({}: AboutProjectProps) {
    const navigate = useNavigate()
    return <h1>What is this project even about?</h1>
}