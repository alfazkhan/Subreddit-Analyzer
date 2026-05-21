import { Button, HStack, VStack, Text } from "@chakra-ui/react";
import {useDispatch} from "react-redux";
import {userInputAction} from "../../store/userInput.js"

// const Suggestions = [
//   { name: "r/India", link: "India" },
//   { name: "r/Mumbai", link: "Mumbai" },
//   { name: "r/Munich", link: "Munich" },
//   { name: "r/AskIndianWomen", link: "AskIndianWomen" },
//   { name: "r/BoycottIsrael", link: "BoycottIsrael" },
//   { name: "r/LegalAdviceIndia", link: "LegalAdviceIndia" },
// ];

function dateTimeFormatter(rawTimestamp) {
  const date = new Date(rawTimestamp);
  const formattedDate = date
    .toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .replace(",", "")
    .toUpperCase();

  return formattedDate;
}

export default function SubredditsSuggestions({ cacheSummary }) {

  const dispatch = useDispatch()
  

  return (
    <HStack>
      {Object.keys(cacheSummary).map((sub) => (
        <VStack key={sub + "stack"} gap="-1.5">
          <Button
            key={sub}
            size="xs"
            color="white"
            fontWeight="black"
            bg="orange.600"
            onClick={() => {
              dispatch(userInputAction.handleNameChange(sub.link));
              dispatch(userInputAction.handleCountChange(cacheSummary[sub]?.count))
            }}
            marginBottom={2}
          >
            {sub}
          </Button>
          <Text
            key={`${sub}-count`}
            color="green.400"
            fontSize="xx-small"
            textAlign="left"
          >
            Cached Posts: {cacheSummary[sub]?.count}
          </Text>
          <Text
            key={`${sub}-last-updated`}
            fontSize="xx-small"
            textAlign="left"
          >
            Last Scrapped post:
          </Text>
          <Text
            key={`${sub}-datetime`}
            color="green.400"
            fontSize="xx-small"
            textAlign="left"
          >
            {dateTimeFormatter(cacheSummary[sub]?.last_updated)}
          </Text>
        </VStack>
      ))}
    </HStack>
  );
}
