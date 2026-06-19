import { Button, CloseButton, Dialog, Portal } from "@chakra-ui/react";
import { useImperativeHandle, useState } from "react";

export default function AlertDialog({ ref, onDelete, id, message }) {
    const [open, setOpen] = useState(false)
    
      useImperativeHandle(ref, () => {
    return {
      open() {
        setOpen(true)
      },
      close(){
        setOpen(false)
      }
    };
  });
  
  return (
    <Dialog.Root role="dialog" modal open={open} >
      {/* <Dialog.Trigger asChild>
        <Button variant="outline" size="sm">
          Open Dialog
        </Button>
      </Dialog.Trigger> */}
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content color="black">
            <Dialog.Header>
              <Dialog.Title>Are you sure?</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <p>
                {message}
              </p>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
              </Dialog.ActionTrigger>
              <Button colorPalette="red" fontWeight="bolder" onClick={()=>onDelete(id)}>Delete</Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" onClick={() => setOpen(false)}/>
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
