import type { ForwardRefExoticComponent, RefAttributes } from "react";
import type { PasswordInputProps } from "@/util/Types";

export const PasswordInput: ForwardRefExoticComponent<
  PasswordInputProps & RefAttributes<HTMLInputElement>
>;
