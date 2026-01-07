package com.chatapp.demo.controller;

import com.chatapp.demo.models.Message;
import com.chatapp.demo.repositories.MessageRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin("*")
public class MessageController {

    @Autowired
    private MessageRepo messageRepo;

    // Get chat history (VBS style)
    @GetMapping("/messages/{user1}/{user2}")
    public List<Message> getChatHistory(@PathVariable int user1, @PathVariable int user2) {
        return messageRepo.findChatHistory(user1, user2);
    }

    // Get all messages for a user - FIXED ✅
    @GetMapping("/messages/{userId}")
    public List<Message> getUserMessages(@PathVariable int userId) {
        return messageRepo.findByReceiverId(userId);
    }

    // Mark as seen
    @PutMapping("/messages/seen/{id}")
    public String markAsSeen(@PathVariable int id) {
        Message msg = messageRepo.findById(id).orElse(null);
        if (msg != null) {
            msg.setStatus("SEEN");
            messageRepo.save(msg);
            return "Marked as Seen";
        }
        return "Message Not Found";
    }
}