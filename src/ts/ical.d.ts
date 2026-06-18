declare module "ical.js" {
  export function parse(input: string): unknown;

  export class Time {
    toJSDate(): Date;
  }

  export class Property {
    getFirstValue(): unknown;
    toJSON(): [string, Record<string, string>, ...unknown[]];
  }

  export class Component {
    constructor(jcal: unknown);
    getFirstSubcomponent(name: string): Component | null;
    getFirstProperty(name: string): Property | null;
    getFirstPropertyValue(name: string): unknown;
    getAllProperties(name: string): Property[];
  }
}
