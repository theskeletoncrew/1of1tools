import { Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { classNames } from "utils";

export enum CollectionSortType {
  FLOOR_DESC = "FLOOR_DESC",
  ATH_SALE_DESC = "ATH_SALE_DESC",
  DAILY_VOLUME_DESC = "DAILY_VOLUME_DESC",
  WEEKLY_VOLUME_DESC = "WEEKLY_VOLUME_DESC",
  TOTAL_VOLUME_DESC = "TOTAL_VOLUME_DESC",
  SIZE_ASC = "SIZE_ASC",
  NAME_ASC = "NAME_ASC",
}

interface Props {
  sort: CollectionSortType;
  didChangeSort: (sort: CollectionSortType) => void;
}

const sortOptions = [
  {
    value: CollectionSortType.TOTAL_VOLUME_DESC,
    label: "Total Volume",
  },
  {
    value: CollectionSortType.WEEKLY_VOLUME_DESC,
    label: "1 week Volume",
  },
  {
    value: CollectionSortType.DAILY_VOLUME_DESC,
    label: "24 hour Volume",
  },
  {
    value: CollectionSortType.ATH_SALE_DESC,
    label: "All-Time High Sale",
  },
  {
    value: CollectionSortType.FLOOR_DESC,
    label: "Floor Price",
  },
  { value: CollectionSortType.SIZE_ASC, label: "Size" },
  { value: CollectionSortType.NAME_ASC, label: "Name" },
];

const CollectionSort: React.FC<Props> = ({ sort, didChangeSort }) => {
  return (
    <Menu as="div" className="relative inline-block text-left h-full">
      <div className="flex items-center gap-2 h-full">
        <span className="whitespace-nowrap text-indigo-500">Sort by:</span>
        <Menu.Button className="inline-flex w-full justify-center items-center rounded-lg border border-indigo-600 bg-transparent px-4 h-full text-xs font-medium text-indigo-400 hover:bg-indigo-900 hover:bg-opacity-50">
          {sortOptions.find((s) => s.value === sort)?.label ??
            sortOptions[0]!.label}
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
            {sortOptions.map((option) => (
              <Menu.Item key={option.value}>
                {({ active }) => (
                  <a
                    href="#"
                    className={classNames(
                      active ? "bg-gray-100 text-gray-900" : "text-gray-700",
                      "block px-4 py-2 text-xs hover:text-gray-700"
                    )}
                    onClick={() => didChangeSort(option.value)}
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

export default CollectionSort;
