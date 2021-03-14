package com.jannthomas.ustudy.ui.mensa

import android.app.DatePickerDialog
import android.os.Build
import android.os.Bundle
import android.view.*
import androidx.annotation.RequiresApi
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.snackbar.Snackbar
import com.jannthomas.ustudy.Account
import com.jannthomas.ustudy.R
import java.util.*


class MensaFragment : Fragment() {

    private lateinit var mensaViewModel: MensaViewModel
    private var selectedDate = GregorianCalendar()
    private var mensaList: RecyclerView? = null

    override fun onCreateView(
            inflater: LayoutInflater,
            container: ViewGroup?,
            savedInstanceState: Bundle?
    ): View? {
        mensaViewModel =
                ViewModelProvider(this).get(MensaViewModel::class.java)
        val root = inflater.inflate(R.layout.fragment_home, container, false)

        val mensaList: RecyclerView = root.findViewById(R.id.mensa_meal_list)
        val llm = LinearLayoutManager(this.context)
        llm.orientation = LinearLayoutManager.VERTICAL
        mensaList.setLayoutManager(llm)

        this.mensaList = mensaList
        reload()

        setHasOptionsMenu(true)

        return root
    }

    override fun onCreateOptionsMenu(menu: Menu, inflater: MenuInflater) {
        inflater.inflate(R.menu.mensa_menu, menu);
        super.onCreateOptionsMenu(menu, inflater)
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        if (item.itemId == R.id.date_picker) {
            showCalendarView()
        }
        return super.onOptionsItemSelected(item)
    }

    fun reload() {

        Account.getMensas { mensas ->
            Account.getMeals(mensas.map { it.id }, selectedDate) { meals ->
                val adapter = MensaMealAdapter {
                    Snackbar.make(mensaList!!, "${it.name}: ${it.subtitle}", Snackbar.LENGTH_LONG)
                            .show()
                }
                adapter.submitList(meals)

                mensaList!!.post {
                    mensaList!!.adapter = adapter
                }
            }
        }
    }

    fun showCalendarView() {
        DatePickerDialog(
                requireContext(),
                { _, year, monthOfYear, dayOfMonth ->
                    selectedDate.set(Calendar.YEAR, year)
                    selectedDate.set(Calendar.MONTH, monthOfYear)
                    selectedDate.set(Calendar.DAY_OF_MONTH, dayOfMonth)
                    reload()
                },
                selectedDate.get(Calendar.YEAR),
                selectedDate.get(Calendar.MONTH),
                selectedDate.get(Calendar.DAY_OF_MONTH)
        ).show()
    }
}