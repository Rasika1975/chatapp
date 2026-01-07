package com.chatapp.demo.repositories;

import com.chatapp.demo.models.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MessageRepo extends JpaRepository<Message, Integer> {

    // VBS style - direct query
    @Query("SELECT m FROM Message m WHERE (m.senderId = ?1 AND m.receiverId = ?2) OR (m.senderId = ?2 AND m.receiverId = ?1) ORDER BY m.time")
    List<Message> findChatHistory(int user1, int user2);

    List<Message> findByReceiverId(int receiverId);
}