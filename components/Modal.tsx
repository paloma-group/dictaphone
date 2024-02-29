import { Fragment, useState, useEffect, Dispatch, SetStateAction } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { type NoteWithTransforms, TTInput } from "@/components/Note";
import { createClient } from "@/utils/supabase/client";
import { transform } from "@/utils/openai/transform";

// Define a function to render paragraphs from text
const renderParagraphs = (text: string): JSX.Element[] => {
  const { text: transformationText } = JSON.parse(text);
  const parsedTransformation = Array.isArray(transformationText) ? transformationText : transformationText.split('\n');

  return parsedTransformation.map((paragraph: string, index: number) =>
    paragraph ? <p key={index} className='text-sm text-gray-500'>{paragraph}</p> : <br key={index} />
  );
};

export default function Modal({
  title,
  note,
  input,
  open = false,
  setOpen,
}: {
  title?: string;
  note: NoteWithTransforms;
  input: TTInput;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setIsLoading(true)

    // Find transformation
    const transformedText = note.transcript_transformations.find(
      (t) => t?.transcript_transformation_inputs?.type === title,
    )?.transformed_text;

    if (!transformedText) {
      (async () => {
        const text = await transform(note.transcript, input.input);

        if (!text) return;

        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        const { data, error } = await supabase
          .from("transcript_transformations")
          .insert({
            input_id: input.id,
            note_id: note.id,
            transformed_text: text,
            user_id: note.user_id,
          })
          .select()
          .limit(1)
          .single();

        if (data?.transformed_text) {
          // @ts-ignore
          // Hacky way so we don't have to refetch... TODO: find a better way
          note.transcript_transformations.push(data);
          setText(data.transformed_text);
          setIsLoading(false)
        }
      })();
    } else {
      setIsLoading(false)
      setText(transformedText);
    }
  }, [open]);

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
                <div>
                  <div className="mt-3 text-center sm:mt-5">
                    {title && (
                      <Dialog.Title
                        as="h3"
                        className="text-base font-semibold leading-6 text-gray-900"
                      >
                        {title}
                      </Dialog.Title>
                    )}
                    <div className="mt-2">
                    {
                      isLoading ? (
                        <p className='text-sm text-gray-500'>Loading...</p>
                      ) : (
                        renderParagraphs(text)
                      )
                    }
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    onClick={() => setOpen(false)}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
