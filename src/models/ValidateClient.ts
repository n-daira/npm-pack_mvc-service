import { UnprocessableException } from "../exceptions/Exception";
import { TableModel } from "./TableModel";

type TError = {code?: string; message?: string;};

export default class ValidateClient {
    private model: TableModel;
    constructor(model: TableModel) {
        this.model = model;
    }
    
    public tryDate(value: any, isExcludeTime: boolean = false): Date | false {
        if (value instanceof Date) {
            return value;
        } else if (typeof value !== 'string') {
            return false;
        }

        try {
            const [datePart, timePart] = value.split(' ');
            const [year, month, day] = datePart.split('-').map(Number);
            let [hours, minutes, seconds] = [0, 0, 0];
            if (timePart !== undefined && isExcludeTime === false) {
                [hours, minutes, seconds] = timePart.split(':').map(Number);
            }

            // 日付の整合性チェック
            const date = new Date(year, month - 1, day, hours, minutes, seconds);
            if (date.getFullYear() !== year || 
                date.getMonth() + 1 !== month || 
                date.getDate() !== day ||
                date.getHours() !== hours ||
                date.getMinutes() !== minutes ||
                date.getSeconds() !== seconds
            ) {
                return false;
            }
            
            return date;
        } catch (ex) {
            return false;
        }
    }

    public validateInList(options: {[key: string]: any}, key: string, list: Array<number | string | boolean>, error?: TError) {
        const column = this.model.getColumn(key);
        const value = options[key];
        if (value === undefined || value === null || value === "") {
            return;
        }
        
        if (list.includes(value) === false) {
            const code = error?.code ?? "000";
            let message = error?.message;
            if (message === undefined) {
                message = `{column} must be one of the items in the {list}. ({value})`;
            }
            message = message.replace('{column}', column.alias ?? column.columnName);
            message = message.replace('{value}', value.toString());
            message = message.replace('{list}', list.join(', '));
            throw new UnprocessableException(code, message);
        }
    }

    public validateUnderNow(options: {[key: string]: any}, key: string, error?: TError) {
        const column = this.model.getColumn(key);
        const value = options[key];
        if (value === undefined || value === null || value === "") {
            return;
        }

        const date = this.tryDate(value);
        if (date === false) {
            throw new Error("The value must be a Date or a valid date string  when using validateUnderNow.");
        }

        const now = new Date();
        if (date > now) {
            const code = error?.code ?? "000";
            let message = error?.message;
            if (message === undefined) {
                message = `{column} should be entered on or before now. ({value})`;
            }
            message = message.replace('{column}', column.alias ?? column.columnName);
            message = message.replace('{value}', value.toString());
            throw new UnprocessableException(code, message);
        }
    }

    public validateUnderToday(options: {[key: string]: any}, key: string, isErrorToday: boolean, error?: TError): void {
        const column = this.model.getColumn(key);
        const value = options[key];
        if (value === undefined || value === null || value === "") {
            return;
        }

        const date = this.tryDate(value);
        if (date === false) {
            throw new Error("The value must be a Date or a valid date string when using validateUnderToday.");
        }

        date.setHours(0);
        date.setMinutes(0);
        date.setSeconds(0);
        date.setMilliseconds(0);

        const today = new Date();
        today.setHours(0);
        today.setMinutes(0);
        today.setSeconds(0);
        today.setMilliseconds(isErrorToday ? 0 : 1);

        if (date >= today) {
            const code = error?.code ?? "000";
            let message = error?.message;
            if (message === undefined) {
                if (isErrorToday) {
                    message = `{column} should be entered before today. ({value})`;
                } else {
                    message = `{column} should be entered on or before today. ({value})`;
                }
            }
            message = message.replace('{column}', column.alias ?? column.columnName);
            message = message.replace('{value}', value.toString());
            throw new UnprocessableException(code, message);
        }
    }

    public validateRegExp(options: {[key: string]: any}, key: string, regExp: RegExp | string, error?: TError): void {
        const column = this.model.getColumn(key);
        const value = options[key];
        if (value === undefined || value === null || value === "") {
            return;
        }

        if (typeof value !== 'string') {
            throw new Error("The value must be a string when using validateStringRegExp.");
        }

        if (typeof regExp === 'string') {
            regExp = new RegExp(regExp);
        }

        if (regExp.test(value) === false) {
            const code = error?.code ?? "000";
            let message = error?.message;
            if (message === undefined) {
                message = `{column} is invalid. ({value})`;
            }
            message = message.replace('{column}', column.alias ?? column.columnName);
            message = message.replace('{value}', value.toString());
            throw new UnprocessableException(code, message);
        }
    }

    public validatePositiveNumber(options: {[key: string]: any}, key: string, error?: TError) {
        const column = this.model.getColumn(key);
        const value = options[key];
        if (value === undefined || value === null || value === "") {
            return;
        }

        if (typeof value !== 'number' && typeof value !== 'string') {
            throw new Error("The value must be a valid number string or number when using validatePositiveNumber.");
        }

        if (isNaN(Number(value))) {
            throw new Error("The value must be a valid number string or number when using validatePositiveNumber.");
        }

        if (Number(value) <= 0) {
            const code = error?.code ?? "000";
            let message = error?.message;
            if (message === undefined) {
                message = `Please enter a value greater than 0 for {column}. ({value})`;
            }
            message = message.replace('{column}', column.alias ?? column.columnName);
            message = message.replace('{value}', value.toString());
            throw new UnprocessableException(code, message);
        }
    }
}