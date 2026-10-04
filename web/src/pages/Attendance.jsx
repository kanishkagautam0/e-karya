
import { useCallback, useEffect, useRef, useState } from "react";
import "./Attendance.css";

const API_URL = "http://localhost:5000/api";

const ATTENDANCE_STATUSES = [
  "PRESENT",
  "ABSENT",
  "HALF_DAY",
  "LEAVE",
  "HOLIDAY",
];

function Attendance() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanTimerRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState("Camera is ready");
  const [currentTime, setCurrentTime] = useState(() => new Date());

  const [attendance, setAttendance] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [attendanceError, setAttendanceError] = useState("");

  const getToken = useCallback(() => {
    return localStorage.getItem("token");
  }, []);

  const loadAttendance = useCallback(async () => {
    try {
      setLoadingAttendance(true);
      setAttendanceError("");

      const token = getToken();

      if (!token) {
        setAttendanceError("Please login again.");
        return;
      }

      const today = new Date().toISOString().split("T")[0];

      const response = await fetch(
        `${API_URL}/attendance?from=${today}&to=${today}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load attendance"
        );
      }

      setAttendance(data.attendance || []);
    } catch (error) {
      console.error("Load attendance error:", error);
      setAttendanceError(
        error.message || "Failed to load attendance"
      );
    } finally {
      setLoadingAttendance(false);
    }
  }, [getToken]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoadingAttendance(true);
        setAttendanceError("");

        const token = localStorage.getItem("token");

        if (!token) {
          if (!cancelled) {
            setAttendanceError("Please login again.");
            setLoadingAttendance(false);
          }
          return;
        }

        const today = new Date().toISOString().split("T")[0];

        const response = await fetch(
          `${API_URL}/attendance?from=${today}&to=${today}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load attendance"
          );
        }

        if (!cancelled) {
          setAttendance(data.attendance || []);
        }
      } catch (error) {
        console.error("Load attendance error:", error);

        if (!cancelled) {
          setAttendanceError(
            error.message || "Failed to load attendance"
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingAttendance(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      }

      if (scanTimerRef.current) {
        window.clearTimeout(scanTimerRef.current);
      }
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
    setScanning(false);
  };

  const startCamera = async () => {
    try {
      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        setStatus("Camera is not supported by this browser.");
        return;
      }

      setStatus("Requesting camera access...");

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            width: 1280,
            height: 720,
            facingMode: "user",
          },
          audio: false,
        });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCameraActive(true);
      setStatus("Camera active. Ready for scanning.");
    } catch (error) {
      console.error("Camera error:", error);

      setCameraActive(false);
      setStatus(
        "Unable to access camera. Please allow camera permission."
      );
    }
  };

  const recordAttendance = async () => {
    try {
      const token = getToken();

      if (!token) {
        setStatus("Please login again.");
        return;
      }

      const now = new Date();

      const attendanceDate = now
        .toISOString()
        .split("T")[0];

      const checkIn = now
        .toISOString()
        .slice(0, 19);

      const response = await fetch(
        `${API_URL}/attendance`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            attendanceDate,
            checkIn,
            status: ATTENDANCE_STATUSES[0],
            remarks: "Face verification attendance",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to record attendance"
        );
      }

      setStatus("Attendance recorded successfully.");

      await loadAttendance();
    } catch (error) {
      console.error("Record attendance error:", error);

      setStatus(
        error.message || "Failed to record attendance."
      );
    }
  };

  const startScan = () => {
    if (!cameraActive) {
      setStatus("Please start the camera first.");
      return;
    }

    if (scanning) {
      return;
    }

    setScanning(true);
    setStatus("Scanning for face...");

    scanTimerRef.current = window.setTimeout(async () => {
      setScanning(false);
      setStatus("Face verified. Recording attendance...");

      await recordAttendance();
    }, 2500);
  };

  const handleStopCamera = () => {
    stopCamera();
    setStatus("Camera stopped.");
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString([], {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatAttendanceTime = (value) => {
    if (!value) {
      return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const presentCount = attendance.filter(
    (item) => item.status === "PRESENT"
  ).length;

  const absentCount = attendance.filter(
    (item) => item.status === "ABSENT"
  ).length;

  const lateCount = attendance.filter((item) => {
    if (!item.check_in) {
      return false;
    }

    const checkIn = new Date(item.check_in);

    return (
      !Number.isNaN(checkIn.getTime()) &&
      checkIn.getHours() >= 10
    );
  }).length;

  return (
    <div className="attendance-page">
      <div className="attendance-container">
        <header className="attendance-header">
          <div>
            <span className="attendance-label">
              ATTENDANCE MANAGEMENT
            </span>

            <h1>Face Recognition Attendance</h1>

            <p>
              Secure employee attendance using facial
              verification.
            </p>
          </div>

          <div className="attendance-clock">
            <strong>{formatTime(currentTime)}</strong>

            <span>{formatDate(currentTime)}</span>
          </div>
        </header>

        <div className="attendance-grid">
          <section className="camera-card">
            <div className="camera-header">
              <div>
                <h2>Face Scanner</h2>

                <p>
                  Position your face inside the scanning
                  area.
                </p>
              </div>

              <span
                className={`camera-status ${
                  cameraActive ? "active" : "inactive"
                }`}
              >
                <span className="status-dot"></span>

                {cameraActive
                  ? "Camera Active"
                  : "Camera Off"}
              </span>
            </div>

            <div className="camera-wrapper">
              <video
                ref={videoRef}
                className={`camera-video ${
                  cameraActive ? "visible" : ""
                }`}
                autoPlay
                muted
                playsInline
              />

              {!cameraActive && (
                <div className="camera-placeholder">
                  <div className="camera-icon">
                    📷
                  </div>

                  <h3>Camera not started</h3>

                  <p>
                    Click Start Camera to activate your
                    webcam.
                  </p>
                </div>
              )}

              {cameraActive && (
                <div
                  className={`face-frame ${
                    scanning ? "scanning" : ""
                  }`}
                >
                  <span className="corner top-left"></span>
                  <span className="corner top-right"></span>
                  <span className="corner bottom-left"></span>
                  <span className="corner bottom-right"></span>

                  {scanning && (
                    <div className="scan-line"></div>
                  )}
                </div>
              )}
            </div>

            <div className="scanner-status">
              {scanning && (
                <span className="status-pulse"></span>
              )}

              {status}
            </div>

            <div className="camera-actions">
              {!cameraActive ? (
                <button
                  className="primary-button"
                  type="button"
                  onClick={startCamera}
                >
                  Start Camera
                </button>
              ) : (
                <>
                  <button
                    className="primary-button"
                    type="button"
                    onClick={startScan}
                    disabled={scanning}
                  >
                    {scanning
                      ? "Scanning..."
                      : "Start Face Scan"}
                  </button>

                  <button
                    className="secondary-button"
                    type="button"
                    onClick={handleStopCamera}
                  >
                    Stop Camera
                  </button>
                </>
              )}
            </div>
          </section>

          <aside className="attendance-side">
            <section className="today-card">
              <div className="side-card-title">
                <div className="title-icon">✓</div>

                <div>
                  <h2>Today's Attendance</h2>

                  <p>Current office status</p>
                </div>
              </div>

              <div className="attendance-numbers">
                <div className="attendance-number">
                  <strong>{presentCount}</strong>
                  <span>Present</span>
                </div>

                <div className="attendance-number">
                  <strong>{lateCount}</strong>
                  <span>Late</span>
                </div>

                <div className="attendance-number">
                  <strong>{absentCount}</strong>
                  <span>Absent</span>
                </div>
              </div>
            </section>

            <section className="instructions-card">
              <h2>How it works</h2>

              <div className="instruction">
                <span>01</span>

                <div>
                  <strong>Start Camera</strong>

                  <p>
                    Allow browser access to your camera.
                  </p>
                </div>
              </div>

              <div className="instruction">
                <span>02</span>

                <div>
                  <strong>Position Your Face</strong>

                  <p>
                    Keep your face clearly visible inside
                    the frame.
                  </p>
                </div>
              </div>

              <div className="instruction">
                <span>03</span>

                <div>
                  <strong>Face Verification</strong>

                  <p>
                    e-Karya verifies the employee.
                  </p>
                </div>
              </div>

              <div className="instruction">
                <span>04</span>

                <div>
                  <strong>Attendance Recorded</strong>

                  <p>
                    Check-in time is recorded
                    automatically.
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </div>

        <section className="attendance-history">
          <div className="history-header">
            <div>
              <h2>Today's Records</h2>

              <p>
                Verified employee attendance records will
                appear here.
              </p>
            </div>
          </div>

          {attendanceError && (
            <div className="empty-attendance">
              <div className="empty-icon">!</div>

              <h3>Unable to load attendance</h3>

              <p>{attendanceError}</p>

              <button
                className="primary-button"
                type="button"
                onClick={loadAttendance}
              >
                Try Again
              </button>
            </div>
          )}

          {!attendanceError && loadingAttendance && (
            <div className="empty-attendance">
              <div className="empty-icon">...</div>

              <h3>Loading attendance...</h3>

              <p>
                Please wait while today's records are
                loaded.
              </p>
            </div>
          )}

          {!attendanceError &&
            !loadingAttendance &&
            attendance.length === 0 && (
              <div className="empty-attendance">
                <div className="empty-icon">✓</div>

                <h3>No attendance records yet</h3>

                <p>
                  Verified employee check-ins will appear
                  here.
                </p>
              </div>
            )}

          {!attendanceError &&
            !loadingAttendance &&
            attendance.length > 0 && (
              <div className="attendance-table-wrapper">
                <table className="attendance-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Employee ID</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                      <th>Status</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>

                  <tbody>
                    {attendance.map((item) => (
                      <tr key={item.id}>
                        <td>{item.name || "-"}</td>

                        <td>
                          {item.employee_id || "-"}
                        </td>

                        <td>
                          {formatAttendanceTime(
                            item.check_in
                          )}
                        </td>

                        <td>
                          {formatAttendanceTime(
                            item.check_out
                          )}
                        </td>

                        <td>{item.status || "-"}</td>

                        <td>{item.remarks || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </section>
      </div>
    </div>
  );
}

export default Attendance;

