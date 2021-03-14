package com.jannthomas.ustudy

import android.R.attr.password
import android.annotation.SuppressLint
import android.app.AlertDialog
import android.content.Context
import android.content.Context.MODE_PRIVATE
import android.content.SharedPreferences
import android.text.InputType
import android.util.Log
import android.widget.EditText
import com.franmontiel.persistentcookiejar.PersistentCookieJar
import com.franmontiel.persistentcookiejar.cache.SetCookieCache
import com.franmontiel.persistentcookiejar.persistence.SharedPrefsCookiePersistor
import com.google.android.material.textfield.TextInputLayout
import kotlinx.serialization.Serializable
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.Json
import okhttp3.*
import org.liquidplayer.javascript.JSContext
import org.liquidplayer.javascript.JSFunction
import org.liquidplayer.javascript.JSObject
import org.liquidplayer.javascript.JSValue
import java.io.BufferedReader
import java.util.*

@SuppressLint("StaticFieldLeak")
object Account {
    var identifier = "DE/HSFulda"
    var context = JSContext()
    private var university: JSObject? = null
    private var activityContext: Context? = null

    private var sharedPref: SharedPreferences? = null

    var universityObject: University? = null
    var selectedUserGroup: String
        get() = sharedPref!!.getString("$identifier-UserGroup", universityObject?.userGroups?.first()?.id) ?: "-"
        set(value) = sharedPref!!.edit().putString("$identifier-UserGroup", value).commit().let{}

    init { }

    fun initialize(context: Context) {
        activityContext = context
        sharedPref = context.getSharedPreferences("credentials", MODE_PRIVATE)

        // TODO: Credential retriever
        // Standard Functions
        val account = this
        val includeFunction = object : JSFunction(Account.context, "include") {
            public fun include(file: String) {
                account.import(file)
            }
        }
        Account.context.property("include", includeFunction)

        val setAccountNameFunction = object : JSFunction(Account.context, "setAccountName") {
            public fun setAccountName(filename: String) {
                System.out.println("setAccountName: " + filename)
            }
        }
        Account.context.property("setAccountName", setAccountNameFunction)

        loadFetch()
        loadCredentialReceiver()

        load("modules.js")
        load("extensions.js")
        import("main.js")
        // TODO: Initialize another way?
        university = Account.context.evaluateScript("new HSFulda();").toObject()

        universityObject = Json { ignoreUnknownKeys = true } .decodeFromString<University>(getString("Payloads/$identifier/main.json"))
    }

    private fun loadFetch() {
        load("JSFetchExtension.js")

        val cookieJar: CookieJar = PersistentCookieJar(SetCookieCache(), SharedPrefsCookiePersistor(activityContext))
        val client = OkHttpClient.Builder()
                .cookieJar(cookieJar)
                .build()

        val fetchFunction = object : JSFunction(Account.context, "fetch") {
            public fun fetch(url: String, arguments: JSValue?): JSValue {

                val internalPromiseFunction = object : JSFunction(Account.context, "internalPromiseFunction") {
                    public fun internalPromiseFunction(thenFunction: JSFunction, catchFunction: JSFunction) {

                        var requestBuilder = Request.Builder()
                                .url(url)

                        arguments?.let { arguments ->
                            val argumentsJson = arguments.toJSON()
                            val nativeArguments = Json { ignoreUnknownKeys = true } .decodeFromString<FetchArguments>(argumentsJson)

                            nativeArguments.method?.let { method ->
                                nativeArguments.body?.let { body ->
                                    requestBuilder = requestBuilder
                                            .method(method, RequestBody.create(null, body))
                                } ?: run {
                                    requestBuilder = requestBuilder
                                            .method(method, null)
                                }
                            }

                            nativeArguments.headers?.let { headers ->
                                requestBuilder = requestBuilder.headers(Headers.of(headers))
                            }
                        }

                        val request = requestBuilder
                                .build()

                        Thread(Runnable {
                            client.newCall(request).execute().use { nativeResponse ->

                                var nativeHeaders = emptyMap<String, String>().toMutableMap()
                                for (headerKey in nativeResponse.headers().names()) {
                                    nativeHeaders[headerKey] = nativeResponse.header(headerKey)
                                            ?: ""
                                }
                                context.property("_nativeHeaders", nativeHeaders)
                                context.property("_nativeResponseCode", nativeResponse.code())
                                context.property("_nativeBody", nativeResponse.body()!!.string())
                                context.property("_requestedURL", url)

                                val headers = context.evaluateScript("new Headers(_nativeHeaders);")
                                context.property("_headers", headers)
                                val response = context.evaluateScript("new Response(_requestedURL, _headers, false, _nativeResponseCode, _nativeBody);")

                                thenFunction.call(null, response)
                            }
                        }).start()
                    }
                }
                context.property("_promiseFunction", internalPromiseFunction)

                return context.evaluateScript("new Promise(_promiseFunction);")
            }
        }
        context.property("fetch", fetchFunction)
    }

    private fun showAlert(title: String, isPassword: Boolean, completion: (result: String?) -> Unit) {
        val textInputLayout = TextInputLayout(activityContext!!)
        textInputLayout.setPadding(
                19,
                0,
                19,
                0
        )
        val input = EditText(activityContext!!)
        if (isPassword) {
            input.setInputType(InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD)
        }
        textInputLayout.addView(input)

        val alert = AlertDialog.Builder(activityContext!!)
                .setTitle(title)
                .setView(textInputLayout)
                .setPositiveButton("OK") { dialog, _ ->
                    completion(input.text.toString())
                    dialog.cancel()
                }
                .setNeutralButton("Abbrechen") { dialog, _ ->
                    completion(null)
                    dialog.cancel()
                }
                .create()

        alert.show()
    }

    private fun loadCredentials(credentials: List<CredentialRequirement>, previousValues: Map<String, String?>, completion: (Map<String, String?>) -> Unit) {
        if (credentials.isEmpty()) {
            completion(previousValues)
            return
        }

        val first = credentials[0]
        sharedPref!!.getString(first.id, null)?.let {
            loadCredentials(credentials.drop(1), previousValues + mapOf(first.id to it), completion)
            return
        }

        showAlert(first.type ?: first.id, first.isPassword == true) {
            sharedPref!!.edit().putString(first.id, it).commit()
            loadCredentials(credentials.drop(1), previousValues + mapOf(first.id to it), completion)
        }
    }

    private fun loadCredentialReceiver() {
        val retrieveCredentialsFunction = object : JSFunction(Account.context, "retrieveCredentials") {
            public fun retrieveCredentials(arguments: JSValue, completion: JSValue) {

                val json = arguments.toJSON()
                val credentialRequirements = Json {
                    ignoreUnknownKeys = true
                } .decodeFromString<CredentialRetrievementConfiguration>(json)

                loadCredentials(credentialRequirements.requirements, mapOf()) {
                    completion.toFunction().call(
                            university?.toObject(),
                            it
                    )
                }
            }
        }
        context.property("retrieveCredentials", retrieveCredentialsFunction)
    }

    fun import(file: String): JSValue {
        return load("Payloads/$identifier/$file")
    }

    fun load(file: String): JSValue {
        return context.evaluateScript(getString(file))
    }

    fun getString(file: String): String {
        activityContext?.let { ctx ->
            val inputStream = ctx.assets.open(file)

            val reader = BufferedReader(inputStream.reader())
            reader.use { reader ->
                return reader.readText()
            }
            return ""
        } ?: run {
            Log.d("UStudy", "Tried to load file '$file' without an activityContext set.")
        }
        return ""
    }

    fun getMensas(completion: (mensas: List<Mensa>) -> Unit) {
        val completion = object : JSFunction(context, "completion") {
            fun completion(value: JSValue) {
                val objs = Json { ignoreUnknownKeys = true } .decodeFromString<List<Mensa>>(value.toJSON())

                completion(objs)
            }
        }

        university?.property("getMensas")?.toFunction()?.call(university, completion)
    }

    fun getMeals(mensas: List<String>, date: Calendar, completion: (meals: List<Meal>) -> Unit) {
        val completion = object : JSFunction(context, "completion") {
            fun completion(value: JSValue) {
                val objs = Json { ignoreUnknownKeys = true } .decodeFromString<List<Meal>>(value.toJSON())
                completion(objs)
            }
        }

        val date = context.evaluateScript("new Date(${date.timeInMillis})")
        university?.property("getMensaFood")?.toFunction()?.call(university, mensas, date, completion)
    }

    fun getGrades(completion: (grades: List<Grade>) -> Unit) {
        val completion = object : JSFunction(context, "completion") {
            fun completion(value: JSValue) {
                val objs = Json { ignoreUnknownKeys = true } .decodeFromString<List<Grade>>(value.toJSON())
                completion(objs)
            }
        }

        university?.property("getGrades")?.toFunction()?.call(university, completion)
    }
}