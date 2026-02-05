/**
 * @file AhrsMessage.ts
 * @description Strongly typed interface and validator for the AHRS_v1 protocol.
 */

interface AHRS_Header {
    seq: number;       // Monotonic sequence number
    ts_ns: number;     // Timestamp in nanoseconds
    frame_id: string;  // Reference coordinate frame
}

interface AHRS_Data {
    orientation: [number, number, number, number]; // [w, x, y, z] Quaternion
    angular_velocity: [number, number, number];    // [rad/s] X, Y, Z
    linear_acceleration: [number, number, number]; // [m/s^2] X, Y, Z
    calibration_status?: number;
}

export interface AhrsMessage {
    header: AHRS_Header;
    data: AHRS_Data;
}

/**
 * Validates a potential AhrsMessage against the protocol specification.
 * @param msg The object to validate
 * @returns True if the object conforms to AhrsMessage structure
 */
export function validateAhrsMessage(msg: any): boolean {
    // Note: In a production environment, this would utilize a robust JSON Schema validator library.
    if (!msg || typeof msg !== 'object' || !msg.header || !msg.data) return false;
    
    const h = msg.header;
    if (typeof h.seq !== 'number' || typeof h.ts_ns !== 'number' || typeof h.frame_id !== 'string') return false;
    
    const d = msg.data;
    if (!Array.isArray(d.orientation) || d.orientation.length !== 4) return false;
    if (!Array.isArray(d.angular_velocity) || d.angular_velocity.length !== 3) return false;
    if (!Array.isArray(d.linear_acceleration) || d.linear_acceleration.length !== 3) return false;

    return true;
}
