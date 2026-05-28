export namespace BASE_FIELD_TYPES {
    export { BooleanField as boolean };
    export { SelectField as select };
    export { RadioField as radio };
    export { TextField as text };
    export { NumberField as number };
}
export default BASE_FIELD_TYPES;
declare function BooleanField({ field, value, onChange }: {
    field: any;
    value: any;
    onChange: any;
}): import("react").JSX.Element;
declare function SelectField({ field, value, onChange }: {
    field: any;
    value: any;
    onChange: any;
}): import("react").JSX.Element;
declare function RadioField({ field, value, onChange }: {
    field: any;
    value: any;
    onChange: any;
}): import("react").JSX.Element;
declare function TextField({ field, value, onChange }: {
    field: any;
    value: any;
    onChange: any;
}): import("react").JSX.Element;
declare function NumberField({ field, value, onChange }: {
    field: any;
    value: any;
    onChange: any;
}): import("react").JSX.Element;
