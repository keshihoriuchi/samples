defmodule SessionManager.SessionManagerTest do
  use ExUnit.Case

  alias SessionManager.SessionSupervisor
  alias SessionManager.SessionRegistry
  alias SessionManager.SessionWorker

  test "regsiter and unregister" do
    {:ok, pid} = DynamicSupervisor.start_child(SessionSupervisor, {SessionWorker, {"k1", "v1"}})
    assert [{pid, nil}] == Registry.lookup(SessionRegistry, "k1")
    ref = Process.monitor(pid)
    assert SessionWorker.get_value(pid) == "v1"
    SessionWorker.stop(pid)
    assert_receive({:DOWN, ^ref, :process, ^pid, :normal})
    :ok = wait_until_process_removed(20)
  end

  defp wait_until_process_removed(0) do
    :error
  end

  defp wait_until_process_removed(n) do
    case Registry.lookup(SessionRegistry, "k1") do
      [] ->
        :ok

      [{_pid, nil}] ->
        Process.sleep(50)
        wait_until_process_removed(n - 1)
    end
  end
end
