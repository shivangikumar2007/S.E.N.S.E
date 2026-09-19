import java.util.*;

public class Firewall {

    // ==========================================
    // FIREWALL DATA
    // ==========================================

    // Stores blocked IP addresses
    private static Set<String> blockedIPs = new HashSet<>();

    // Stores failed login attempts for each IP
    private static Map<String, Integer> failedAttempts = new HashMap<>();

    // Maximum failed login attempts
    private static final int MAX_ATTEMPTS = 5;


    // ==========================================
    // CHECK WHETHER IP IS BLOCKED
    // ==========================================

    public static boolean isIPBlocked(String ip) {

        if (blockedIPs.contains(ip)) {

            System.out.println(
                "[FIREWALL] BLOCKED IP: " + ip
            );

            return true;
        }

        return false;
    }


    // ==========================================
    // CHECK INCOMING REQUEST
    // ==========================================

    public static boolean checkRequest(String ip, String path) {

        System.out.println(
            "\n[FIREWALL] Incoming request"
        );

        System.out.println(
            "IP: " + ip
        );

        System.out.println(
            "Path: " + path
        );


        // Check if IP is already blocked
        if (isIPBlocked(ip)) {

            System.out.println(
                "[FIREWALL] Request REJECTED"
            );

            return false;
        }


        // Suspicious paths
        String[] blockedPaths = {
            "/.env",
            "/config",
            "/admin",
            "/wp-admin"
        };


        for (String blockedPath : blockedPaths) {

            if (path.equals(blockedPath)) {

                blockedIPs.add(ip);

                System.out.println(
                    "[FIREWALL] Suspicious path detected!"
                );

                System.out.println(
                    "[FIREWALL] IP BLOCKED: " + ip
                );

                return false;
            }
        }


        System.out.println(
            "[FIREWALL] Request ALLOWED"
        );

        return true;
    }


    // ==========================================
    // LOGIN PROTECTION
    // ==========================================

    public static boolean checkLogin(
            String ip,
            String username,
            String password) {


        System.out.println(
            "\n[LOGIN] Login attempt from: " + ip
        );


        // Check whether IP is already blocked
        if (isIPBlocked(ip)) {

            System.out.println(
                "[LOGIN] Login REJECTED"
            );

            return false;
        }


        // Demo credentials
        if (!username.equals("demo") ||
            !password.equals("1234")) {


            int attempts =
                failedAttempts.getOrDefault(ip, 0) + 1;

            failedAttempts.put(ip, attempts);


            System.out.println(
                "[SECURITY] Failed login attempt: "
                + attempts + "/" + MAX_ATTEMPTS
            );


            // Block after 5 failed attempts
            if (attempts >= MAX_ATTEMPTS) {

                blockedIPs.add(ip);

                System.out.println(
                    "[FIREWALL] IP BLOCKED: " + ip
                );

                return false;
            }


            return false;
        }


        // Successful login
        failedAttempts.remove(ip);


        System.out.println(
            "[LOGIN] Login SUCCESSFUL"
        );

        return true;
    }


    // ==========================================
    // SENSOR DATA VALIDATION
    // ==========================================

    public static boolean checkSensorData(
            double energy,
            double water,
            int occupancy) {


        System.out.println(
            "\n[SENSOR] Checking sensor data..."
        );


        System.out.println(
            "Energy: " + energy + " kWh"
        );

        System.out.println(
            "Water: " + water + " L"
        );

        System.out.println(
            "Occupancy: " + occupancy
        );


        // Check for impossible negative values
        if (energy < 0 ||
            water < 0 ||
            occupancy < 0) {


            System.out.println(
                "[FIREWALL] INVALID sensor data BLOCKED"
            );

            return false;
        }


        System.out.println(
            "[FIREWALL] Sensor data ACCEPTED"
        );

        return true;
    }


    // ==========================================
    // MANUALLY BLOCK IP
    // ==========================================

    public static void blockIP(String ip) {

        blockedIPs.add(ip);

        System.out.println(
            "[FIREWALL] IP manually blocked: " + ip
        );
    }


    // ==========================================
    // UNBLOCK IP
    // ==========================================

    public static void unblockIP(String ip) {

        blockedIPs.remove(ip);

        failedAttempts.remove(ip);

        System.out.println(
            "[FIREWALL] IP unblocked: " + ip
        );
    }


    // ==========================================
    // SHOW FIREWALL STATUS
    // ==========================================

    public static void showStatus() {

        System.out.println(
            "\n========================================"
        );

        System.out.println(
            "        FIREWALL SECURITY STATUS"
        );

        System.out.println(
            "========================================"
        );

        System.out.println(
            "Firewall Status : ACTIVE"
        );

        System.out.println(
            "Blocked IPs     : " + blockedIPs.size()
        );

        System.out.println(
            "Failed Logins   : " + failedAttempts.size()
        );

        System.out.println(
            "========================================"
        );
    }


    // ==========================================
    // MAIN METHOD - DEMONSTRATION
    // ==========================================

    public static void main(String[] args) {


        System.out.println(
            "========================================"
        );

        System.out.println(
            "     SMART RESOURCE DASHBOARD"
        );

        System.out.println(
            "     APPLICATION FIREWALL"
        );

        System.out.println(
            "========================================"
        );


        // --------------------------------------
        // TEST 1: NORMAL REQUEST
        // --------------------------------------

        System.out.println(
            "\n========== TEST 1: NORMAL REQUEST =========="
        );

        checkRequest(
            "192.168.1.10",
            "/api/dashboard"
        );


        // --------------------------------------
        // TEST 2: SUSPICIOUS REQUEST
        // --------------------------------------

        System.out.println(
            "\n========== TEST 2: SUSPICIOUS REQUEST =========="
        );

        checkRequest(
            "192.168.1.20",
            "/admin"
        );


        // --------------------------------------
        // TEST 3: BLOCKED IP TRIES AGAIN
        // --------------------------------------

        System.out.println(
            "\n========== TEST 3: BLOCKED IP =========="
        );

        checkRequest(
            "192.168.1.20",
            "/api/dashboard"
        );


        // --------------------------------------
        // TEST 4: VALID SENSOR DATA
        // --------------------------------------

        System.out.println(
            "\n========== TEST 4: VALID SENSOR DATA =========="
        );

        checkSensorData(
            42.5,
            1200,
            25
        );


        // --------------------------------------
        // TEST 5: INVALID SENSOR DATA
        // --------------------------------------

        System.out.println(
            "\n========== TEST 5: INVALID SENSOR DATA =========="
        );

        checkSensorData(
            -20,
            1200,
            25
        );


        // --------------------------------------
        // TEST 6: FAILED LOGIN ATTEMPTS
        // --------------------------------------

        System.out.println(
            "\n========== TEST 6: LOGIN PROTECTION =========="
        );

        String testIP = "192.168.1.30";


        for (int i = 1; i <= 5; i++) {

            checkLogin(
                testIP,
                "wrongUser",
                "wrongPassword"
            );
        }


        // --------------------------------------
        // TEST 7: BLOCKED USER TRIES AGAIN
        // --------------------------------------

        System.out.println(
            "\n========== TEST 7: BLOCKED USER =========="
        );

        checkLogin(
            testIP,
            "demo",
            "1234"
        );


        // --------------------------------------
        // FINAL FIREWALL STATUS
        // --------------------------------------

        System.out.println(
            "\n========== FINAL STATUS =========="
        );

        showStatus();


        System.out.println(
            "\nFirewall demonstration completed."
        );
    }
}