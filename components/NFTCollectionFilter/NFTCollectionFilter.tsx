import { Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { classNames } from "utils";

export enum NFTFilterType {
  ALL_ITEMS = "ALL_ITEMS",
  LISTED_ITEMS = "LISTED_ITEMS",
}

interface Props {
  filter: NFTFilterType;
  didChangeFilter: (sort: NFTFilterType) => void;
}

const filterOptions = [
  {
    value: NFTFilterType.ALL_ITEMS,
    label: "All Items",
  },
  {
    value: NFTFilterType.LISTED_ITEMS,
    label: "Listed Items",
  },
];

const NFTCollectionFilter: React.FC<Props> = ({ filter, didChangeFilter }) => {
  return (
    <Menu as="div" className="relative inline-block text-left h-full">
      <div className="flex items-center gap-2 h-full">
        <span className="whitespace-nowrap text-indigo-500">Show:</span>
        <Menu.Button className="inline-flex w-full whitespace-nowrap justify-center items-center rounded-lg border border-indigo-600 bg-transparent px-4 h-full text-xs font-medium text-indigo-400 hover:bg-indigo-900 hover:bg-opacity-50">
          {filterOptions.find((f) => f.value === filter)?.label ??
            filterOptions[0]!.label}
          <ChevronDownIcon className="-mr-1 ml-2 h-5 w-5" aria-hidden="true" />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {filterOptions.map((option) => (
              <Menu.Item key={option.value}>
                {({ active }) => (
                  <a
                    href="#"
                    className={classNames(
                      active ? "bg-gray-100 text-gray-900" : "text-gray-700",
                      "block px-4 py-2 text-xs hover:text-gray-700"
                    )}
                    onClick={() => didChangeFilter(option.value)}
                  >
                    {option.label}
                  </a>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default NFTCollectionFilter;
