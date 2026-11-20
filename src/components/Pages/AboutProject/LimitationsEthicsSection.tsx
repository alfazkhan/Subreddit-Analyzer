import { Box } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { LIMITATIONS_ETHICS_CONTENT } from "@/data/aboutContent";
import { PointList, Section, SubHeading } from "./aboutUi";
import { LuArrowRight } from "react-icons/lu";

export function LimitationsEthicsSection() {
  return (
    <Section id="section-limitations-ethics" title="Limits and ethics">
      <Box display="grid" gap={12}>
        <Box>
          <SubHeading>Limitations</SubHeading>
          <PointList items={LIMITATIONS_ETHICS_CONTENT.limitations} />
        </Box>

        <Box>
          <SubHeading>Ethics and privacy</SubHeading>
          <PointList items={LIMITATIONS_ETHICS_CONTENT.ethics} />
          <Box mt={5}>
            <RouterLink
              to="/privacy"
              style={{
                color: "var(--chakra-colors-orange-300)",
                fontSize: "0.9375rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              Read the full privacy policy <LuArrowRight />
            </RouterLink>
          </Box>
        </Box>
      </Box>
    </Section>
  );
}
