import { Box, Button, Heading, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import {
  AUTHOR_FACTS,
  HYPOTHESES_PILLARS,
  SHOW_SUPERVISORS,
  SUPERVISORS,
  THE_QUESTION,
  THESIS_CONTEXT,
  THESIS_METADATA,
} from "@/data/aboutContent";
import { GlossaryTerm } from "./GlossaryTerm";
import { C, P, Section, SubHeading } from "./aboutUi";
import { LuArrowUpRight, LuGithub, LuLinkedin, LuMail } from "react-icons/lu";

const HYPOTHESIS_COUNT = HYPOTHESES_PILLARS.reduce((n, p) => n + p.hypotheses.length, 0);

const STATS = [
  { value: THESIS_METADATA.snapshotSampleSize.toLocaleString("en-US"), label: "posts analysed" },
  { value: String(THESIS_METADATA.cityCount), label: "city subreddits" },
  { value: String(HYPOTHESIS_COUNT), label: "hypotheses tested" },
  { value: "7 days", label: "wait before measuring" },
];

export function ProjectHero() {
  return (
    <Box as="header" maxW="820px">
      <Text fontSize="sm" fontWeight="medium" color={C.accent} mb={3}>
        MBA thesis project · ISM Munich
      </Text>
      <Heading
        as="h1"
        fontSize={{ base: "4xl", md: "5xl" }}
        fontWeight="bold"
        letterSpacing="-0.03em"
        lineHeight="1.1"
        color={C.heading}
        mb={5}
      >
        About this project
      </Heading>
      <Text fontSize={{ base: "lg", md: "xl" }} lineHeight="1.6" color="gray.300" maxW="62ch">
        Subreddit Analyzer collects public posts from {THESIS_METADATA.cityCount} city subreddits and
        measures which ones get discussed and upvoted, and why. It&apos;s the research tool behind my
        master&apos;s thesis.
      </Text>
      <Text fontSize="sm" color={C.muted} mt={3}>
        By {AUTHOR_FACTS.name} · Thesis due {THESIS_METADATA.submissionPeriod} · Data snapshot{" "}
        {THESIS_METADATA.snapshotDate}
      </Text>

      <Box display="flex" flexWrap="wrap" gap={3} mt={7}>
        <Button asChild size="md" bg="orange.500" color="white" fontWeight="semibold" _hover={{ bg: "orange.400" }}>
          <RouterLink to="/">Open the dashboard</RouterLink>
        </Button>
        <Button
          asChild
          size="md"
          variant="outline"
          borderColor="whiteAlpha.300"
          color="gray.100"
          _hover={{ bg: "whiteAlpha.100" }}
        >
          <a href={AUTHOR_FACTS.links.github} target="_blank" rel="noopener noreferrer">
            <LuGithub /> View on GitHub <LuArrowUpRight />
          </a>
        </Button>
      </Box>

      <Box
        as="dl"
        display="grid"
        gridTemplateColumns={{ base: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }}
        gap={{ base: 5, md: 8 }}
        mt={10}
        pt={8}
        borderTopWidth="1px"
        borderColor={C.line}
      >
        {STATS.map((s) => (
          <Box key={s.label}>
            <Box as="dd" m={0} fontSize={{ base: "2xl", md: "3xl" }} fontWeight="semibold" color={C.heading} letterSpacing="-0.02em">
              {s.value}
            </Box>
            <Box as="dt" fontSize="sm" color={C.muted}>
              {s.label}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export function QuestionSection() {
  return (
    <Section id="section-question" title="The question">
      <Box display="grid" gap={5}>
        <P>{THE_QUESTION.paragraphs[0]}</P>
        <P>{THE_QUESTION.paragraphs[1]}</P>
        <P>
          The thesis frames this as an <GlossaryTerm termId="attention-economy">attention economy</GlossaryTerm>{" "}
          problem: which kinds of <GlossaryTerm termId="civic-friction">civic friction</GlossaryTerm> rise to the
          top, and which get ignored.
        </P>

        <Box as="figure" m={0} my={3} pl={5} borderLeftWidth="3px" borderColor="orange.400">
          <Text fontSize="sm" color={C.muted} mb={2}>
            Research question
          </Text>
          <Text as="blockquote" m={0} fontSize={{ base: "lg", md: "xl" }} lineHeight="1.55" color={C.heading} fontWeight="medium">
            {THE_QUESTION.researchQuestion}
          </Text>
        </Box>

        <Text fontSize="sm" color={C.muted} lineHeight="1.6" maxW="68ch">
          Thesis title: <Text as="span" color="gray.400" fontStyle="italic">{THESIS_METADATA.title}</Text>
        </Text>
      </Box>
    </Section>
  );
}

function ContactLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  const external = href.startsWith("http");
  return (
    <Box
      as="a"
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      display="inline-flex"
      alignItems="center"
      gap={2}
      fontSize="sm"
      color="gray.200"
      textDecoration="none"
      _hover={{ color: "orange.300" }}
      _focusVisible={{ outline: "2px solid", outlineColor: "orange.400", outlineOffset: "2px" }}
    >
      {icon}
      {children}
    </Box>
  );
}

export function AboutMeSection() {
  const { links } = AUTHOR_FACTS;
  return (
    <Section id="section-about-me" title="About me">
      <Box display="grid" gap={5}>
        <P>
          I&apos;m <Text as="strong" color={C.heading}>{AUTHOR_FACTS.name}</Text>, an {AUTHOR_FACTS.degree} student at{" "}
          {AUTHOR_FACTS.institution}. My thesis is due in {AUTHOR_FACTS.thesisSubmission}.
        </P>
        <P>{AUTHOR_FACTS.bio}</P>

        <Box as="figure" m={0} pl={5} borderLeftWidth="3px" borderColor={C.line}>
          <Text fontSize="sm" color={C.muted} mb={1.5}>
            Why I built it
          </Text>
          <Text as="blockquote" m={0} fontSize="md" lineHeight="1.7" color="gray.200">
            {AUTHOR_FACTS.whyIBuiltThis}
          </Text>
        </Box>

        <Box display="flex" flexWrap="wrap" columnGap={6} rowGap={2}>
          <ContactLink href={`mailto:${links.email}`} icon={<LuMail />}>
            {links.email}
          </ContactLink>
          <ContactLink href={links.github} icon={<LuGithub />}>
            GitHub
          </ContactLink>
          {links.linkedin && (
            <ContactLink href={links.linkedin} icon={<LuLinkedin />}>
              LinkedIn
            </ContactLink>
          )}
        </Box>

        {SHOW_SUPERVISORS && (
          <Box>
            <Text fontSize="sm" color={C.muted} mb={1}>
              Supervisors
            </Text>
            {SUPERVISORS.map((sup) => (
              <Text key={sup.name} fontSize="sm" color={C.text}>
                {sup.name} ({sup.role}), {sup.institution}
              </Text>
            ))}
          </Box>
        )}

        <Box mt={4}>
          <SubHeading>Why this is my thesis</SubHeading>
          <P mb={4}>{THESIS_CONTEXT.instrumentStatement}</P>
          <Box as="ol" m={0} p={0} listStyleType="none" display="grid" gap={4}>
            {THESIS_CONTEXT.contributions.map((item, index) => (
              <Box as="li" key={item.title} display="grid" gridTemplateColumns="28px 1fr" gap={3}>
                <Text fontSize="sm" fontWeight="semibold" color={C.accent} lineHeight="1.7" fontVariantNumeric="tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </Text>
                <Box>
                  <Text fontWeight="semibold" color={C.heading}>
                    {item.title}
                  </Text>
                  <Text color={C.text} lineHeight="1.7" maxW="64ch">
                    {item.description}
                  </Text>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Section>
  );
}
