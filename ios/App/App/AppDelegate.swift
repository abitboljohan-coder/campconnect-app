import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    // ─── Notifications push (APNs → plugin Capacitor PushNotifications) ───
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: deviceToken)
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: error)
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}

// ─── Cycle de vie par scènes (UIScene) ─────────────────────────────────────
//
// Obligatoire depuis le SDK iOS 27 : une app compilée avec Xcode 27 qui ne
// l'adopte pas est tuée au lancement, avant d'afficher quoi que ce soit
// (_UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption). C'est ce qui
// a fait planter le build 120, le premier compilé par Xcode Cloud avec Xcode 27.
//
// La scène est déclarée dans Info.plist (UIApplicationSceneManifest). La fenêtre
// et CAPBridgeViewController viennent toujours de Main.storyboard, comme avant :
// cette classe se contente de relayer à Capacitor les liens campconnect://,
// qu'iOS adresse désormais à la scène et non plus à l'AppDelegate.
//
// Même logique que le SceneDelegateProxy de Capacitor 8.5, écrite avec l'API de
// la version installée (8.4.2) pour ne pas changer de dépendances.
class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    var window: UIWindow?

    // Liens reçus au lancement à froid, en attente du pont Capacitor.
    private var liensEnAttente: Set<UIOpenURLContext> = []
    private var activitesEnAttente: Set<NSUserActivity> = []

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        // Lancement à froid par un lien (QR code du camping) : les greffons ne
        // sont pas encore chargés, un lien relayé maintenant serait perdu. On le
        // relaie à la première apparition du pont Capacitor.
        if connectionOptions.urlContexts.isEmpty && connectionOptions.userActivities.isEmpty { return }
        liensEnAttente = connectionOptions.urlContexts
        activitesEnAttente = connectionOptions.userActivities
        NotificationCenter.default.addObserver(self, selector: #selector(pontAffiche), name: .capacitorViewDidAppear, object: nil)
    }

    @objc private func pontAffiche() {
        NotificationCenter.default.removeObserver(self, name: .capacitorViewDidAppear, object: nil)
        for context in liensEnAttente { ouvrir(context.url) }
        for activite in activitesEnAttente { continuer(activite) }
        liensEnAttente = []
        activitesEnAttente = []
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        for context in URLContexts { ouvrir(context.url) }
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        continuer(userActivity)
    }

    private func ouvrir(_ url: URL) {
        _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, open: url, options: [:])
    }

    private func continuer(_ activite: NSUserActivity) {
        _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, continue: activite, restorationHandler: { _ in })
    }
}
