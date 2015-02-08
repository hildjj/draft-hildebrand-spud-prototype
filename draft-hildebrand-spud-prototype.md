---
title: Session Protocol for User Datagrams (SPUD) Prototype
abbrev: I-D
docname: draft-hildebrand-spud-prototype-00
date: 2015-2-5
category: info
ipr: trust200902

author:
 -
    ins: J. Hildebrand
    name: Joe Hildebrand
    organization: Cisco Systems
    email: jhildebr@cisco.com
 -
    ins: B. Trammell
    name: Brian Trammell
    organization: ETH Zurich
    email: ietf@trammell.ch

normative:
  RFC2119:

informative:
  RFC1149:

--- abstract

This is an abstract.

--- middle

# Introduction

This is just a protoype.  Good protocol to follow.  Might be implemented in DTLS for example.

## Terminology

In this document, the key words "MUST", "MUST NOT", "REQUIRED",
"SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY",
and "OPTIONAL" are to be interpreted as described in BCP 14, RFC 2119
{{RFC2119}}.

# Requirements

* Deploy on existing Internet
* No kernel modifications required
* No root permissions required
* Only widely-available APIs required
* Choices for congestion, retransmit, etc.
* Single firewall-traversal mechanism, multiple transport semantics
* Multiple interfaces for each endpoint
* Low overhead • Determine protocol in use (fast, but not port-specific)
* Associate packets with a flow (fast) • Policy per-flow

# Lifetime of a session


    +--------------------+ +-----+
    |                    | |close|
    |                    | |     |
    |                    v |     v
    |      +-----open--- +-------+ <--close----+
    |      |             |unknown|             |
    |      |    +------> +-------+ --ack,-+    |
    |      |    |                    data |    |
    |      |  close                       |    |
    |      v    |                         v    |
    |     +-------+ -------data-------> +--------+
    | +---|opening|                     |resuming|---+
    | |   +-------+ <------open-------- +--------+   |
    | |     ^   |                         |    ^     |
    | |     |   |                         |    |     |
    | |     |   |                         |    |     |
    | +open-+   +-ack--> +-------+ <--ack-+    +-data+
    |                    |running|
    +-------close------- +-------+
                          ^    |
                          |    |
                          |    | open,ack,data
                          +----+
{: #states title="State transitions"}

# Packet layout

# Detecting usage

# Commands

* Data
* Open
* Close
* Ack

# Additional information

If any of the command, adec, or pdec bits are set, the following data in the packet is CBOR.  No fragmentation mechanism is specified yet, but one is likely needed later.

# Initiating a session

CBOR

# Closing a session

CBOR

# Path declarations

SPUD can be used for path declarations: information delivered to the endpoints from devices along the path. Path declarations can be thought of as enhanced ICMP for transports using SPUD, allowing information about the condition or state of the path or the session to be communicated directly to a sender. 

Path declarations are always sent directly back to a sender in response to a SPUD packet. The scope of a path declaration is the session (identified by Session ID) to which it is associated, and devices along the path cannot make declarations to endpoints without a session to associate them with. To send a declaration directly to the sender, the triggering packet's source port and IP address and destination port and IP address are reversed and placed in the header of the path destination packet. This is necessary to associate the packet with any network address translation (NAT) state on the reverse path.

A path declaration is a SPUD packet with the PDEC (Path Declaration) flag set, and contains a path declaration formatted in CBOR in its payload. A path declaration is simply a CBOR map, which may have the following keys:

- ipaddr: the IPv4 address or IPv6 address of the sender, as an array of 4 or 16 bytes in network byte order. This is necessary as the source and destination IP address of the packet contains the destination and source IP addresses 
- ttl: uint8_t, IP time to live / IPv6 Hop Limit of associated 
- cookie: an identifier for this path declaration, used [EDITOR'S NOTE what is this for, again?].
- url: an array of UTF-8 encoded URLs identifying some information about the path or its relationship with the session. Each URL is intended primarily as a codepoint representing some path condition, and retrieval of content at the URL should include human-readable description and links to wider context for understanding the codepoint. 
- icmp: a byte array containing an ICMP payload. This is intended to allow ICMP messages (which may be blocked by the path, or not properly handled by the sender) to be bound to a session.  [EDITOR'S NOTE define types and codes for which this is valid, define how this works for IPMPv6]. Note that sending a path declaration ICMP message is not a substitute for sending a required ICMP or ICMPv6 message. [EDITOR'S NOTE citations]

## Path Declaration Vocabulary

The SPUD mechanism is defined to be completely extensible in terms of the types of path declarations that can be made. However, in order for this mechanism to be of use, endpoints and devices along the path must share a relatively limited vocabulary of path declarations. The following subsections briefly explore declarations we believe may be useful, and which will be further developed on the background of concrete use cases to be defined as part of the SPUD effort.

Terms in this vocabulary considered universally useful may be added to the SPUD path declaration map keys, which in this case would then be defined as an IANA registry. 

### Maximum Datagram Size

A path element may tell the endpoint the maximum size of a datagram it is willing or able to forward for a session, to augment various path MTU discovery mechanisms.

### Rate Limit

A path element may tell the endpoint the maximum data rate (in octets or packets) that it is willing or able to forward for a session. As all path declarations are advisory, the device along the path must not rely on the endpoint to set its sending rate at or below the declared rate limit, and reduction of rate is not a guarantee to the endpoint of zero queueing delay. This mechanism is intended for "gross" rate limitation, i.e. to declare that the output interface is connected to a limited or congested link, not as a substitute for loss-based or explicit congestion notification on the RTT timescale.

### Latency Advisory

A path element may tell the endpoint the latency attributable to traversing that path element. This mechanism is intended for "gross" latency advisories, for instance to declare the output interface is connected to a satellite or {{RFC1149}} link.

### Prohibition Report

A path element which refuses to forward a packet may declare why the packet was not forwarded, similar to ICMP's various Destination Unreachable codes.

# Declaration reflection

In some cases, a device along the path may wish to send a path declaration but where the reverse path is not reachable from the device [EDITOR'S NOTE: Bob Briscoe raised this issue during the SEMI workshop, which has largely to do with tunnels. It is not clear to me (bht) how a point along the path would know that it must reflect a declaration, but this is included for completeness] may instead reflect that declaration. A reflected declaration is a SPUD packet with both the PDEC and ADEC (Application Declaration) flags set, and contains the same content as a path declaration would, but has the same source address and port and destination address and port as the SPUD packet which triggered it.

When a SPUD endpoint receives a declaration reflection, it reflects it: swapping the source and destination addresses, stripping the ADEC bit, and sending it as if it were a path declaration.

# Application declarations

Applications may also use the SPUD mechanism to describe the traffic in the session to the application on the other side, and/or to any point along the path. As with path declarations, the scope of an application declaration is the session (identified by Session ID) to which it is associated. 

An application declaration is a SPUD packet with the ADEC (Application Declaration) flag set, and contains an application declaration formatted in CBOR in its payload. As with path declarations, an application is simply a CBOR map, which may have the following keys:

- cookie: an identifier for this application declaration, used [EDITOR'S NOTE what is this for, again?].
- url: an array of UTF-8 encoded URLs identifying some information about the application's traffic within this session. Each URL is intended primarily as a codepoint representing some classification or parameter of the application traffic, and retrieval of content at the URL should include human-readable description and links to wider context for understanding the codepoint. 

Each application declaration should be forwarded by each device along the path (presuming, of course, that the session itself is deemed to be forwardable) to the opposite endpoint. Each device along the path can inspect the application declaration, associate relevant information in the application declaration with the session ID, and/or take action appropriate to the declaration according to its policy. If an application declaration causes a device along the path to decide not to forward the application declaration [EDITOR'S NOTE: facility for path abort here?]. 

The definition of an application declaration vocabulary is left as future work; we note only at this point that the mechanism supports such declarations.

# Explicit Congestion Notification

[EDITOR'S NOTE: we'll need to define a binding to ECN if we want it to work with SPUD. I'm pretty sure we do.]


# Errors

CBOR.

# Security Considerations

This gives you ability to expose information about the mumble

# IANA Considerations

## Operations

## May want an IP protocol number
