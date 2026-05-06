import { Button, HStack } from "@chakra-ui/react";
import { useContext } from "react";
import { SubredditContext } from "../../store/SubredditContext.jsx";

const Suggestions = [
  { name: "r/India", link: "India" },
  { name: "r/Mumbai", link: "Mumbai" },
  { name: "r/Munich", link: "Munich" },
  { name: "r/AskIndianWomen", link: "AskIndianWomen" },
  { name: "r/BoycottIsrael", link: "BoycottIsrael" },
  { name: "r/LegalAdviceIndia", link: "LegalAdviceIndia" },
];

export default function SubredditsSuggestions() {
  const { handleNameChange } = useContext(SubredditContext);

  return (
    <HStack>
      {Suggestions.map((sub) => (
        <Button
          key={sub.name}
          size="xs"
          color="white"
          fontWeight="black"
          bg="orange.600"
          onClick={() => handleNameChange(sub.link)}
        >
          {sub.name}
        </Button>
      ))}
    </HStack>
  );
}
