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

* Deploy: existing Internet/kernels
* user space, not root
* Choices for congestion, retransmit, etc.
* Single firewall-traversal mechanism, multiple transport semantics
* Multiple interfaces for each endpoint
* Low overhead • Determine protocol in use (fast, but not port-specific)
* Associate packets with a flow (fast) • Policy per-flow

# Lifetime of a session



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

# BRIAN START
# Path declarations

CBOR

# Declaration reflection

# Application declarations

CBOR

# IP layer addressing

NAT considerations

# BRIAN STOP

# Errors

CBOR.

# Security Considerations

This gives you ability to expose information about the mumble

# IANA Considerations

## Operations

## May want an IP protocol number
