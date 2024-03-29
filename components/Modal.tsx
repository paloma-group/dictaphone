import { createTransform } from '@/actions/transforms';
import { CopyToClipboardButton } from '@/components/CopyToClipboardButton';
import { type NoteWithTransforms, TTPrompt } from '@/components/Note';
import {
  extractRawTextFromTranscript,
  extractTranscriptComponents,
} from '@/utils/notes/transcript';
import { Dialog, Transition } from '@headlessui/react';
import { Dispatch, Fragment, SetStateAction, useEffect, useState } from 'react';
import { track } from '@/utils/analytics/mixpanel';

interface Props {
  title?: string;
  note: NoteWithTransforms;
  prompt?: TTPrompt;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

// Define a function to render paragraphs from text
const renderParagraphs = (text: string) => {
  const parsedTransformation = extractTranscriptComponents(text);

  return parsedTransformation.map((paragraph: string, index: number) =>
    paragraph ? (
      <p key={index} className="text-sm text-gray-500">
        {paragraph}
      </p>
    ) : (
      <br key={index} />
    )
  );
};

export default function Modal({
  title,
  note,
  prompt,
  open = false,
  setOpen,
}: Props) {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setIsLoading(true);

    // Find transformation
    const transformedText = note.transformation_outputs.find(
      (t) => t?.transformation_prompts?.type === title
    )?.transformed_text;

    if (!transformedText) {
      (async () => {
        if (!prompt) return;
        track('transformation-created', { type: prompt.type });
        const response = await createTransform(prompt.id, note.id);

        if (response?.transformed_text) {
          setText(response.transformed_text);
          setIsLoading(false);
        }
      })();
    } else {
      setIsLoading(false);
      setText(transformedText);
    }
  }, [open]);

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={setOpen}>
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

        <div className="fixed inset-0 z-50 w-screen overflow-y-auto">
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 md:max-w-2xl">
                <div>
                  <div className="mt-3 text-center sm:mt-5">
                    {title && (
                      <Dialog.Title
                        as="h3"
                        className="relative text-base font-semibold leading-6 text-gray-900 space-x-4"
                      >
                        {title}
                        {!isLoading && (
                          <div className={'absolute top-0 right-0'}>
                            <CopyToClipboardButton
                              text={extractRawTextFromTranscript(text)}
                            />
                          </div>
                        )}
                      </Dialog.Title>
                    )}
                    <div className="mt-2">
                      {isLoading ? (
                        <p className="text-sm text-gray-500">Loading...</p>
                      ) : (
                        renderParagraphs(text)
                      )}
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
