import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee, Transaction } from "./utils/types"

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()
  const [isLoading, setIsLoading] = useState(false)
  const [isEmployeeLoading, setIsEmployeeLoading] = useState(false)
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([])

  const transactions = useMemo(
    () => allTransactions.length > 0 ? allTransactions : transactionsByEmployee,
    [allTransactions, transactionsByEmployee]
  )

  const loadAllTransactions = useCallback(async () => {
    setIsLoading(true)
    transactionsByEmployeeUtils.invalidateData()

    await employeeUtils.fetchAll()
    await paginatedTransactionsUtils.fetchAll()

    setIsLoading(false)
  }, [employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils])

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      paginatedTransactionsUtils.invalidateData()
      
      setAllTransactions([])
      await transactionsByEmployeeUtils.fetchById(employeeId)
      
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  )

  const loadEmployees = useCallback(async () => {
    setIsEmployeeLoading(true);
    await employeeUtils.fetchAll();
    setIsEmployeeLoading(false);
  }, [employeeUtils]);

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (paginatedTransactions?.data) {
      setAllTransactions((prevTransactions) => [
        ...prevTransactions,
        ...paginatedTransactions.data,
      ]);
    }
  }, [paginatedTransactions]);

  useEffect(() => {
    if (transactionsByEmployee) {
      setAllTransactions((prevTransactions) => [
        ...prevTransactions,
        ...transactionsByEmployee,
      ]);
    }
    
  }, [transactionsByEmployee]);

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      loadAllTransactions()
    }
  }, [employeeUtils.loading, employees, loadAllTransactions])

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={isEmployeeLoading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            setAllTransactions([])
            if (!newValue || newValue.id === "all") {
              await loadAllTransactions()
            } else {
              await loadTransactionsByEmployee(newValue.id)
            }
          }}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions transactions={transactions} />

          {transactions !== null && (
            <button
              className="RampButton"
              disabled={paginatedTransactionsUtils.loading || !paginatedTransactions?.nextPage}
              style={{ display: paginatedTransactions?.nextPage ? 'block' : 'none' }}
              onClick={async () => {
                  await loadAllTransactions();
                }
              }
            >
              View More
            </button>
          )}
        </div>
      </main>
    </Fragment>
  )
}
