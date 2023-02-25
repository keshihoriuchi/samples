defmodule ChatAppTest do
  use ExUnit.Case
  require Logger
  alias ChatApp.ChatRoomWorker
  alias ChatApp.UserWorker
  alias ChatApp.MockInjectableChatRoomWorker

  defmodule UserMock do
    def handle_msg(pid, from_id, msg) do
      send(pid, {:mock, from_id, msg})
    end
  end

  test "Applicationの子孫としてGenServerを起動パターン" do
    {:ok, pid1} = UserWorker.start_link(self())
    :ok = UserWorker.join(pid1, "user1")

    {:ok, pid2} = UserWorker.start_link(self())
    :ok = UserWorker.join(pid2, "user2")

    UserWorker.send_msg(pid1, "msg")

    assert_receive({"user2", "user1", "msg"})
  end

  test "ExUnitの子としてGenServerを起動パターン" do
    {:ok, room_pid} = ChatRoomWorker.start_link(:test)
    :ok = GenServer.call(room_pid, {:join, self(), "user1"})
    :ok = GenServer.call(room_pid, {:join, self(), "user2"})

    :ok = GenServer.cast(room_pid, {:send_msg, "user1", "msg"})
    assert_receive({:"$gen_cast", {:handle_msg, "user1", "msg"}})
  end

  test "コールバックを直接呼ぶパターン" do
    {:noreply, %{users: %{}}} = ChatRoomWorker.handle_cast(
      {:send_msg, "user1", "msg"},
      %{users: %{ref_dummy: {self(), "user2"}}}
    )
    assert_receive({:"$gen_cast", {:handle_msg, "user1", "msg"}})
  end

  test "ExUnitの子としてGenServerを起動パターン (モック差込版)" do
    {:ok, room_pid} = MockInjectableChatRoomWorker.start_link({:test, UserMock})
    :ok = GenServer.call(room_pid, {:join, self(), "user1"})
    :ok = GenServer.call(room_pid, {:join, self(), "user2"})

    :ok = GenServer.cast(room_pid, {:send_msg, "user1", "msg"})
    assert_receive({:mock, "user1", "msg"})
  end

  test "コールバックを直接呼ぶパターン (モック差込版)" do
    {:noreply, %{users: %{}}} = MockInjectableChatRoomWorker.handle_cast(
      {:send_msg, "user1", "msg"},
      %{users: %{ref_dummy: {self(), "user2"}}, user_mod: UserMock}
    )
    assert_receive({:mock, "user1", "msg"})
  end
end
