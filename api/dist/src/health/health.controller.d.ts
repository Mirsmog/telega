export declare class HealthController {
    getHealth(): {
        status: string;
        timestamp: string;
        uptime: number;
        service: string;
        version: string;
    };
    ping(): {
        message: string;
    };
}
