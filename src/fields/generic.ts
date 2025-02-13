import { parseRequired, safeLabel, safeName } from "./utils";
import { v4 as uuidv4 } from "uuid";
import { PropertyDefinition } from "./types";
import { buildFields } from "./fields";

export const buildBaseGroupField = (
  id: string,
  property: PropertyDefinition,
  prefix = ""
): {
  id: string;
  name: string;
  label: string;
  required: boolean;
  help_text: string;
  locked: boolean;
  allow_new_line: boolean;
  show_emoji_picker: boolean;
  type: string;
  display_width: any;
  default: any;
  children: any[];
} => {
  const group = {
    id: `${id}_${uuidv4()}`,
    name: safeLabel(id),
    label: safeName(property.name),
    required: parseRequired(property.rules),
    help_text: property.description,
    locked: false,
    allow_new_line: false,
    show_emoji_picker: false,
    type: "group",
    display_width: null,
    default: property.default,
    occurrence: {
      min: property.rules.content?.min || 0,
      max: property.rules.content?.max || 0,
      sorting_label_field: null,
      default: property.rules.content?.min || 0,
    },
    children: [],
  };
  if (property.type === "array") {
    group.children = buildFields(property.items.properties);
  } else {
    // TODO: Handle non object arrays
    //group.children = buildFields(property.properties);
  }
  return group;
};


export const buildBaseField = (
  id: string,
  property: PropertyDefinition,
  prefix = ""
): {
  id: string;
  name: string;
  label: string;
  required: boolean;
  help_text: string;
  locked: boolean;
  allow_new_line: boolean;
  show_emoji_picker: boolean;
  type: string;
  display_width: any;
  default: any;
  validation_message?: string;
} => {
  return {
    id: `${id}_${uuidv4()}`,
    name: safeLabel(id),
    label: safeName(property.name),
    required: parseRequired(property.rules),
    help_text: property.description,
    locked: false,
    allow_new_line: false,
    show_emoji_picker: false,
    type: "text",
    display_width: null,
    default: property.default,
  };
};
