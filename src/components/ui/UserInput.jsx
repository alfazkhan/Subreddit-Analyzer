import {
  Input,
  InputGroup,
  Field,
  NumberInput,
  HStack,
  Button,
  Checkbox,
  Portal,
  Select,
  createListCollection,
  Spinner
} from "@chakra-ui/react";
import { useEffect, useState, useMemo } from "react";
// import { SubredditContext } from "../../store/SubredditContext.jsx";
import { userInputAction } from "../../store/userInput";

import { useSelector, useDispatch } from "react-redux";

export default function UserInput({ onFetchData, cacheSummary, processingStatus }) {
  const subreddit = useSelector((state) => state.userInputState.subredditName);
  const targetCount = useSelector(
    (state) => state.userInputState.targetPostCount,
  );
  const dispatch = useDispatch();

  const [subredditName, setSubredditName] = useState(subreddit);
  const [postCount, setPostCount] = useState(targetCount);

  useEffect(() => {
    setPostCount(targetCount);
    if(Object.keys(cacheSummary).length !== 0){
      setSubredditName(Object.keys(cacheSummary)[0])
    }
    setSubredditName(subreddit);
  }, [subreddit, targetCount, cacheSummary]);

  function onFetchdataHandler() {
    dispatch(userInputAction.handleNameChange(subredditName));
    dispatch(userInputAction.handleCountChange(postCount));
    onFetchData(subredditName, postCount);
  }

  const selectCollection = useMemo(() => {
    const keys = Object.keys(cacheSummary || {});
    const items = keys.map((key) => ({
      label: key,
      value: key,
    }));
    return createListCollection({ items });
  }, [cacheSummary]);

  return (
    <>
      <HStack
        width="full"
        gap="1"
        justifyContent="center"
        alignItems="baseline"
      >
        <Field.Root flex={1} required>
          <Select.Root
            collection={selectCollection}
            onValueChange={(e) => setSubredditName(e.value[0] || "")}
            value={[Object.keys(cacheSummary)[0]]}
          >
            <Select.HiddenSelect required />
            <Field.Label >
              Select Subreddit <Field.RequiredIndicator />
            </Field.Label>
            <Select.Control>
              <Select.Trigger>
                <Select.ValueText placeholder="Select Subreddit" />
              </Select.Trigger>
              <Select.IndicatorGroup>
                <Select.Indicator />
              </Select.IndicatorGroup>
            </Select.Control>
            <Portal>
              <Select.Positioner>
                <Select.Content color="gray.900">
                  {Object.keys(cacheSummary).map((framework, idx) => (
                    <Select.Item item={framework} key={idx}>
                      {framework}
                      <Select.ItemIndicator />
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Portal>
            <Field.HelperText>
              Select the Subreddit you want to analyze
            </Field.HelperText>
          </Select.Root>
        </Field.Root>
        <HStack>
          <Field.Root required>
            <Field.Label>
              Post Count <Field.RequiredIndicator />
            </Field.Label>
            <NumberInput.Root
              defaultValue={100}
              value={postCount}
              width="full"
              allowMouseWheel
            >
              <NumberInput.Control />
              <NumberInput.Input
                onChange={(e) => setPostCount(e.target.value)}
              />
            </NumberInput.Root>
            <Field.HelperText>
              Enter Number of Posts to be analyzed (Max=10,000)
            </Field.HelperText>
          </Field.Root>

          <Button
            size="sm"
            color="white"
            fontWeight="black"
            bg="orange.600"
            onClick={onFetchdataHandler}
            disabled={processingStatus}
          >
            {processingStatus?
            
            <>
            <Spinner color="white" /> Fetching Posts...
            </>: 
            
            "Fetch Posts"}
          </Button>
        </HStack>
      </HStack>
      <HStack
        width="full"
        gap="1"
        justifyContent="flex-end"
        alignItems="center"
      >
        {/* <Checkbox.Root
          variant="solid"
          colorPalette="orange"
          checked={cacheOnly}
          onCheckedChange={(e) => dispatch(userInputAction.toggleCachingChange(e.checked))}
        >
          <Checkbox.HiddenInput />
          <Checkbox.Control />
          <Checkbox.Label>Use Only Cache</Checkbox.Label>
        </Checkbox.Root> */}
      </HStack>
    </>
  );
}

const frameworks = createListCollection({
  items: [
    { label: "React.js", value: "react" },
    { label: "Vue.js", value: "vue" },
    { label: "Angular", value: "angular" },
    { label: "Svelte", value: "svelte" },
  ],
});
