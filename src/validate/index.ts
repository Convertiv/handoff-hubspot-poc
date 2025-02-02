import chalk from "chalk";
import { HandoffComponent, FieldTypes, PropertyDefinition } from "../fields/types";
import { fetchComponent, fetchComponentList } from "..";

type Severity = "error" | "warning";
export interface FieldValidation { message: string, attribute: string, property?: string, severity?: Severity }[]

const validateField = (
    property: PropertyDefinition,
    key: string
): FieldValidation[] => {
    let errors = [];
    if (!property.type) {
        errors.push({ message: "Field type is required", attribute: "type", property: key, severity: "error" });
    } else if (FieldTypes.indexOf(property.type) === -1) {
        errors.push({ message: `Field type ${property.type} is invalid`, attribute: "type", property: key, severity: "error" });
    }
    if (!property.description) {
        errors.push({ message: "Field description is required", attribute: "description", property: key, severity: "warning" });
    }
    if (!property.name) {
        errors.push({ message: "Field name is required", attribute: "name", property: key, severity: "error" });
    }
    if (!property.default) {
        errors.push({ message: "Field default is required", attribute: "default", property: key, severity: "warning" });
    }

    if (!property.rules) {
        errors.push({ message: "Field rules are required", attribute: "rules", property: key, severity: "warning" });
    } else {
        if (!property.rules.required) {
            errors.push({ message: "Field rules.required is required", attribute: "rules.required", property: key, severity: "error" });
        }
        if (property.rules.content) {
            if (!property.rules.content.min) {
                errors.push({ message: "Content rules must have a minimum length", attribute: "rules.content.min", property: key, severity: "warning" });
            }
            if (!property.rules.content.max) {
                errors.push({ message: "Content rules must have a maximum length", attribute: "rules.content.min", property: key, severity: "warning" });
            }

        }
        if (property.type === "text") {
            if (!property.rules.content) {
                errors.push({ message: "Content rules are required for text fields", attribute: "rules.content", property: key, severity: "error" });
            }
        }
        if (property.type === "array") {
            if (!property.rules.content) {
                errors.push({ message: "Content rules are required for array fields", attribute: "rules.content", property: key, severity: "error" });
            } else {
                if (!property.rules.content.min) {
                    errors.push({ message: "Array fields must have a minimum content length", attribute: "rules.content.min", property: key, severity: "error" });
                } else if (property.rules.content.min < 1) {
                    errors.push({ message: "Array fields must have a maximum content length", attribute: "rules.content.min", property: key, severity: "error" });
                }
                if (!property.rules.content.max) {
                    errors.push({ message: "Content rules must have a maximum length", attribute: "rules.content.min", property: key, severity: "error" });
                } else if (property.rules.content.max < 1) {
                    errors.push({ message: "Content rules maximum length must be greater than 0", attribute: "rules.content.max", property: key, severity: "error" });
                }
            }
            if (!property.items) {
                errors.push({ message: "Items are required for array fields", attribute: "items", property: key, severity: "error" });
            } else {
                if (!property.items.type) {
                    errors.push({ message: "Type is required for array fields", attribute: "items.type", property: key, severity: "error" });
                } else if (FieldTypes.indexOf(property.items.type) === -1) {
                    errors.push({ message: `Field type ${property.items.type} is invalid`, attribute: "items.type", property: key, severity: "error" });
                }
                if (!property.items.properties) {
                    errors.push({ message: "Properties are required for array fields", attribute: "items.properties", property: key, severity: "error" });
                } else {
                    for (let key in property.items.properties) {
                        errors = errors.concat(validateField(property.items.properties[key], key));
                    }
                }
            }
        }
        if (property.type === "image") {
            if (!property.default) {
                errors.push({ message: "Default is required for image fields", attribute: "default", property: key, severity: "error" });
            }
            if (!property.rules.dimensions) {
                errors.push({ message: "Dimensions are required for image fields", attribute: "rules.dimensions", property: key, severity: "error" });
            } else {
                if (!property.rules.dimensions.min) {
                    errors.push({ message: "Minimum is required for image fields", attribute: "rules.dimensions.min", property: key, severity: "error" });
                } else {
                    if (!property.rules.dimensions.min.width) {
                        errors.push({ message: "Minimum width is required for image fields", attribute: "rules.dimensions.width", property: key, severity: "error" });
                    }
                    if (!property.rules.dimensions.min.height) {
                        errors.push({ message: "Minimum height is required for image fields", attribute: "rules.dimensions.height", property: key, severity: "error" });
                    }
                }
            }
        }
    }

    return errors;
}

export const validateModule = (
    component: HandoffComponent
): FieldValidation[] => {
    let errors = [];
    if (!component.code) {
        errors.push({ message: "Component code is required", attribute: "code" });
    }
    if (!component.title) {
        errors.push({ message: "Component title is required", attribute: "title" });
    }
    if (!component.properties) {
        errors.push({ message: "Component properties are required", attribute: "properties" });
    } else {
        for (let key in component.properties) {
            errors = errors.concat(validateField(component.properties[key], key));
        }
    }
    return errors;
}

export const severityFunction = (severity: Severity) => {
    if (severity === "error") {
        return chalk.red;
    }
    return chalk.yellow;
}

export const formatErrors = (errors: FieldValidation[]): string => {
    return errors.map(error => severityFunction(error.severity ?? 'error')(`${capitalize(error.severity)}: ${error.message} ${error.property ? `for ${capitalize(error.property)}` : ""} `)).join("\n");
}

// uppercase the first letter of a string
export const capitalize = (s: string) => {
    if (typeof s !== 'string') return ''
    return s.charAt(0).toUpperCase() + s.slice(1)
}

const validateComponent = async  (id: string) => {
    const data = await fetchComponent(id);
    const component = data.latest;
    const errors = validateModule(component);
    if (errors.length > 0) {
        console.error(chalk.red("Validation failed\n"), formatErrors(errors));
    } else {
        console.log(chalk.green("Validation passed"));
    }
}

export const validateAll = async () => {
    const data = await fetchComponentList();
    data.map(async (component) => {
        // validate the component
        const full = await fetchComponent(component.id);
        const latest = full.latest;
        const errors = validateModule(latest);
        if (errors.length > 0) {
            console.error(chalk.red(`\nValidation failed for ${component.title}`));
            console.log(formatErrors(errors));
        } else {
            console.log(chalk.green(`\nValidation passed for ${component.title}`));
        }
    });
}

export default validateComponent;