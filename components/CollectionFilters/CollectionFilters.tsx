import { Fragment, useState } from "react";
import { Disclosure, Menu, Transition } from "@headlessui/react";
import { classNames } from "utils";
import {
  CheckCircleIcon,
  ChevronRightIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import { XMarkIcon } from "@heroicons/react/20/solid";

interface Props {
  attributes: { [key: string]: Set<string> };
  attributeSelections: { [key: string]: string | null };
  didChangeSelections: (filters: { [key: string]: string | null }) => void;
}

const CollectionFilters: React.FC<Props> = ({
  attributes,
  attributeSelections,
  didChangeSelections,
}) => {
  const [open, setOpen] = useState(false);

  const updateSelection = (attribute: string, value: string) => {
    let updatedSelections = { ...attributeSelections };
    if (updatedSelections[attribute] === value) {
      updatedSelections[attribute] = null;
    } else {
      updatedSelections[attribute] = value;
    }
    didChangeSelections(updatedSelections);
  };

  return (
    <Menu as="div" className="relative inline-block text-left h-full">
      <div className="flex items-center gap-2 h-full">
        <Menu.Button
          onClick={() => setOpen(!open)}
          className="border border-1 border-indigo-600 rounded-lg h-full w-[40px] flex items-center justify-center"
        >
          {open ? (
            <XMarkIcon className="w-5 h-5 text-indigo-400" />
          ) : (
            <FunnelIcon className="w-5 h-5 text-indigo-400" />
          )}
        </Menu.Button>
      </div>
      <Transition
        show={open}
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          unmount={false}
          className="absolute left-0 z-10 mt-2 w-56 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
        >
          <div className="py-1 max-h-[50vh] overflow-y-scroll">
            {Object.keys(attributes).map((attribute, i) => (
              <Menu.Item key={i}>
                {({ active }) => (
                  <Disclosure as="div" key={i} className="space-y-1">
                    {({ open }) => (
                      <>
                        <Disclosure.Button
                          as="label"
                          className={classNames(
                            open
                              ? "bg-gray-100 text-gray-900"
                              : "bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                            "group w-full flex items-center justify-between truncate px-4 py-2 text-left text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          )}
                        >
                          {attribute}
                          <span>
                            <ChevronRightIcon
                              className={classNames(
                                "w-3 h-3",
                                open ? "rotate-90" : ""
                              )}
                            />
                          </span>
                        </Disclosure.Button>
                        <Disclosure.Panel className="space-y-1">
                          {[...(attributes[attribute] ?? [])]
                            .sort()
                            .map((value, j) => (
                              <button
                                key={i + "_" + j}
                                onClick={() => {
                                  updateSelection(attribute, value);
                                }}
                                className="flex w-full items-center rounded-md py-2 px-6 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                              >
                                <CheckCircleIcon
                                  className={classNames(
                                    attributeSelections[attribute] === value
                                      ? "block"
                                      : "hidden",
                                    "w-5 h-5 mr-2"
                                  )}
                                />
                                <span className="truncate">{value}</span>
                              </button>
                            ))}
                        </Disclosure.Panel>
                      </>
                    )}
                  </Disclosure>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default CollectionFilters;
